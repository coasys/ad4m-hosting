# Use the Ubuntu base image
FROM ubuntu:latest

# Install system dependencies or any other tools you need
RUN apt-get update && apt-get install -y \
    libgtk-3-0 libwebkit2gtk-4.0-37 libappindicator3-1 librsvg2-bin patchelf protobuf-compiler cmake \
    curl bash wget tar unzip git python3 build-essential \
    && curl -sL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs \
    && apt-get clean

# Install Go
ENV GO_VERSION 1.22.0
RUN wget https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz -O go.tar.gz \
    && tar -C /usr/local -xzf go.tar.gz \
    && rm go.tar.gz

# Set Go environment variables
ENV GOPATH /go
ENV PATH $GOPATH/bin:/usr/local/go/bin:$PATH

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

# Set the PATH environment variable
ENV PATH="/root/.cargo/bin:/root/.deno/bin:/root/.npm-global/bin:$PATH"

# Clone & checkout the AD4M repo
RUN echo "Cloning AD4M repo 2"
RUN git clone https://github.com/coasys/ad4m.git && cd ad4m \
    && git checkout host-root && pnpm install && cd core && pnpm install && cd ../ \
    && pnpm build-libs && cp target/release/ad4m-executor ../ && cd ../ && rm -rf ad4m

ENV PATH="ad4m/target/release/ad4m-executor:$PATH"

COPY ./start-executor.js /start-executor.js

# Start the ad4m executor
CMD ["node", "./start-executor.js"]