"use client";

import { useState } from "react";
import { runManim } from "./run-manim";

const sampleCode = `
from manim import *

class TriangleScene(Scene):
    def construct(self):
        # Create a triangle
        triangle = Triangle()
        
        # Set the color of the triangle
        triangle.set_fill(BLUE, opacity=0.5)
        triangle.set_stroke(BLUE_E, width=4)
        
        # Add the triangle to the scene
        self.play(Create(triangle))
        
        # Wait for a moment to display the triangle
        self.wait(2)
`;

export const ManimRunner = () => {
	const [result, setResult] = useState<any>(null);

	const onClick = async () => {
		const result = await runManim(sampleCode);
		// Placeholder function to simulate running Manim
		// In a real scenario, this would call the actual Manim execution
		setResult(result);
	};

	return (
		<div className="p-4">
			<h2 className="text-xl font-bold mb-4">Manim Runner</h2>
			<button
				onClick={onClick}
				className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
				type="button"
			>
				Run Manim
			</button>
			{result && (
				<div className="mt-4">
					<h3 className="text-lg font-semibold">Result:</h3>
					<pre className="mt-2">
						{JSON.stringify(result, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
};
