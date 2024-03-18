# Use the Ubuntu base image
FROM ubuntu:latest

# Install system dependencies or any other tools you need
RUN apt-get update && apt-get install -y \
    libgtk-3-0 libwebkit2gtk-4.0-37 libappindicator3-1 librsvg2-bin patchelf protobuf-compiler cmake \
    curl bash wget tar unzip git python3

# Install Go
ENV GO_VERSION 1.22.0
RUN wget https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz -O go.tar.gz \
    && tar -C /usr/local -xzf go.tar.gz \
    && rm go.tar.gz

# Set Go environment variables
ENV GOPATH /go
ENV PATH $GOPATH/bin:/usr/local/go/bin:$PATH

# Install Node
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
RUN echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
RUN ~/.cargo/bin/rustup target add wasm32-unknown-unknown

# Install Deno
RUN curl -fsSL https://deno.land/install.sh | sh
RUN echo 'export DENO_INSTALL="/root/.deno"' >> ~/.bashrc
RUN echo 'export PATH="/root/.deno/bin:$PATH"' >> ~/.bashrc

# Configure npm to use a directory in the root user's home for global packages
RUN mkdir ~/.npm-global \
    && npm config set prefix '~/.npm-global' \
    && echo 'export PATH="~/.npm-global/bin:$PATH"' >> ~/.bashrc

# Install pnpm
RUN npm install -g pnpm

# Clean up to reduce image size
RUN apt-get clean

# Set the PATH environment variable
ENV PATH="/root/.cargo/bin:/root/.deno/bin:/root/.npm-global/bin:$PATH"

# We need killall for the CLI tests
RUN apt-get install -y psmisc

# Clone & checkout the AD4M repo
RUN echo "Cloning AD4M repo 2"
RUN git clone https://github.com/coasys/ad4m.git
WORKDIR ad4m
RUN git checkout host-root

RUN apt-get install -y build-essential

# Install dependencies and build the project
RUN pnpm install
RUN cd core && pnpm install
RUN cd ../
RUN pnpm build-libs

ENV PATH="target/release/ad4m-executor:$PATH"

COPY ./start-executor.js /start-executor.js

WORKDIR /

# Start the ad4m executor
# CMD ["ls", "-al"]
CMD ["node", "./start-executor.js"]