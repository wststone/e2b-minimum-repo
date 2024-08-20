FROM e2bdev/code-interpreter:latest

# ARG ENV=development

# RUN if [ "$ENV" = "development" ]; then \
#     echo "deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy main restricted universe multiverse" > /etc/apt/sources.list && \
#     echo "deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-updates main restricted universe multiverse" >> /etc/apt/sources.list && \
#     echo "deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-backports main restricted universe multiverse" >> /etc/apt/sources.list && \
#     echo "deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-security main restricted universe multiverse" >> /etc/apt/sources.list && \
#     pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple; \
#     apt-get update; \
#     fi

RUN apt-get update && apt-get install -y \
    software-properties-common \
    gcc \
    build-essential \
    ffmpeg \
    libcairo2 \
    libcairo2-dev \
    python3 \
    python3-pip \
    python3-dev \
    libpango1.0-dev \
    libgdk-pixbuf2.0-0 \
    shared-mime-info \
    texlive \
    texlive-latex-extra \
    texlive-science \
    s3fs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    numpy \
    scipy \
    openpyxl \
    xlrd \
    xlwt \
    matplotlib \
    pandas \
    Pillow \
    opencv-python \
    PyPDF2 \
    pdfminer.six \
    sympy \
    scikit-learn \
    python-docx \
    pymunk \
    pygame \
    manim \
    ffmpeg-python \
    pycairo \
    pylatex \
    graphrag