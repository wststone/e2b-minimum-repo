"use server";

import {
    CodeInterpreter,
    ProcessExitError,
    type Logs,
    type Result,
} from "@e2b/code-interpreter";
import { randomUUID } from "crypto";
import { Sandbox } from "e2b";

export type CodeinterpreterResult = {
    results: Result[];
    logs: Logs;
    error?: {
        name: string;
    };
};

const sandboxTimeout = 10 * 60 * 1000; // 10 minutes in ms

const template = "hummingbird"

export async function codeInterperter(
    code: string,
): Promise<CodeinterpreterResult> {
    console.log("codeInterpreter called");

    try {
        const sandbox = await CodeInterpreter.create(template, {
            apiKey: process.env.E2B_API_KEY,
        });

        const execution = await sandbox.notebook.execCell(code);

        const executionResult = execution.toJSON();

        console.log({ executionResult });

        return executionResult;
    } catch (error) {
        console.log(error);
        return {
            logs: {
                stdout: [],
                stderr: [],
            },
            results: [],
            error: {
                name: "UnknownError",
            },
        };
    }
}

export async function getSandboxIDForUser(userID: string) {
    console.log("getting sandbox for user", userID);
    const allSandboxes = await CodeInterpreter.list();
    console.log("all sandboxes", allSandboxes);
    const sandboxInfo = allSandboxes.find(
        (sbx) => sbx.metadata?.userID === userID,
    );

    return sandboxInfo?.sandboxId;
}

// Code Interpreter sandbox
export async function createOrConnectCodeInterpreter(
    userID: string,
    template: string,
) {
    console.log("create or connect code interpreter sandbox", userID);

    const allSandboxes = await CodeInterpreter.list();
    console.log("all code interpreter sandboxes", allSandboxes);

    const sandboxInfo = allSandboxes.find(
        (sbx) =>
            sbx.metadata?.userID === userID && sbx.metadata?.template === template,
    );
    console.log("code interpreter sandbox info", sandboxInfo);

    if (!sandboxInfo) {
        // Vercel's AI SDK has a bug that it doesn't throw an error in the tool `execute` call so we want to be explicit
        try {
            const sbx = await CodeInterpreter.create(template, {
                apiKey: process.env.E2B_API_KEY,
                metadata: {
                    template,
                    userID,
                },
                timeoutMs: sandboxTimeout,
            });

            return sbx;
        } catch (e) {
            console.error("Error creating sandbox", e);
            throw e;
        }
    }

    const sandbox = await CodeInterpreter.connect(sandboxInfo.sandboxId);
    await sandbox.setTimeout(sandboxTimeout);

    return sandbox;
}

export async function createOrConnectSandbox(userID: string, template: string) {
    const allSandboxes = await Sandbox.list();

    const sandboxInfo = allSandboxes.find(
        (sbx) =>
            sbx.metadata?.userID === userID && sbx.metadata?.template === template,
    );

    if (!sandboxInfo) {
        // Vercel's AI SDK has a bug that it doesn't throw an error in the tool `execute` call so we want to be explicit
        try {
            const sbx = await Sandbox.create(template, {
                apiKey: process.env.E2B_API_KEY,
                timeoutMs: sandboxTimeout,
                metadata: {
                    userID,
                    template,
                },
            });
            return sbx;
        } catch (e) {
            console.error("Error creating sandbox", e);
            throw e;
        }
    }

    console.log("reconnecting sandbox", sandboxInfo.sandboxId);

    const killed = await Sandbox.kill(sandboxInfo.sandboxId)

    console.log({ killed })

    const sandbox = await Sandbox.connect(sandboxInfo.sandboxId, {
        apiKey: process.env.E2B_API_KEY,
    });

    await sandbox.setTimeout(sandboxTimeout);

    return sandbox;
}

export async function runPython(userID: string, code: string) {
    const sbx = await createOrConnectCodeInterpreter(userID, "hummingbird");
    console.log("Running code", code);

    const result = await sbx.notebook.execCell(code);
    console.log("Command result", result);

    await sbx.kill();

    return result;
}

export async function runManim(code: string): Promise<CodeinterpreterResult> {
    // Generate a random user ID
    const userId = randomUUID()

    try {
        const sbx = await createOrConnectSandbox(userId, "hummingbird");

        // TODO: not Mount storage
        await mountSandboxStorage(sbx);

        const rootDir = "/app";

        await sbx.files.makeDir(`${rootDir}/media`);

        await sbx.files.write(`${rootDir}/manim.py`, code);

        const files = await sbx.files.list(rootDir);
        console.log(files);

        const ran = await sbx.commands.run(`sudo manim ${rootDir}/manim.py --media_dir ${rootDir}/media`, {
            timeoutMs: sandboxTimeout,
            background: true,
        });

        console.log({ ran })

        const result = await ran.wait();

        const mediaFiles = await sbx.files.list(`${rootDir}/media`);

        console.log("mediaFiles", mediaFiles);

        // await sbx.kill();

        return {
            logs: {
                stdout: [result.stdout],
                stderr: [result.stderr],
            },
            results: [],
        };
    } catch (error) {
        console.log(error);
        if (error instanceof ProcessExitError) {
            return {
                logs: {
                    stdout: [error.stdout],
                    stderr: [error.stderr],
                },
                results: [],
                error: {
                    name: error.name,
                },
            };
        }
        return {
            logs: {
                stdout: [],
                stderr: [],
            },
            results: [],
            error: {
                name: "UnknownError",
            },
        };
    }
}

async function mountSandboxStorage(sandbox: Sandbox) {
    const mountDir = "/home/user/bucket";

    await sandbox.files.makeDir(mountDir);

    // Create a file with the R2 credentials
    // If you use another path for the credentials you need to add the path in the command s3fs command
    await sandbox.files.write(
        "/root/.passwd-s3fs",
        `${process.env.R2_ACCESS_KEY_ID}:${process.env.R2_ACCESS_KEY_SECRET}`,
    );

    await sandbox.commands.run("sudo chmod 600 /root/.passwd-s3fs");

    const output = await sandbox.commands.run(
        `sudo s3fs -o url=https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com -o allow_other ${process.env.BUCKET_NAME} ${mountDir}`,
    );

    if (output.exitCode) {
        throw Error(output.stderr);
    }
}
