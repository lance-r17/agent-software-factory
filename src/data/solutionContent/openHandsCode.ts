const zhCode = {
  NPM_INSTALL: `# 先核对两个硬性前置：Node.js ≥ 24 与 uv
node --version    # 必须 >= v24；本评测沙箱为 v20，无法实测启动
uv --version      # 本地 Agent Server 运行时依赖 uv/uvx

npm install -g @openhands/agent-canvas
agent-canvas --version   # 期望输出 1.43.0
agent-canvas --info      # 查看版本与栈配置
agent-canvas             # 启动全栈，浏览器打开 http://localhost:8000`,
  DOCKER_RUN: `# 固定 tag，不跟 latest；官方故障页记录过 latest 镜像缺文件导致崩溃循环
mkdir -p ~/projects

docker run -it \
  --restart unless-stopped \
  -p 127.0.0.1:8000:8000 \
  -e AGENT_CANVAS_ALLOW_LAN_SESSION_KEY=true \
  -v openhands-data:/home/openhands/.openhands \
  -v "$HOME/projects:/projects" \
  ghcr.io/openhands/agent-canvas:1.43.0

# 浏览器打开 http://localhost:8000/canvas
# AGENT_CANVAS_ALLOW_LAN_SESSION_KEY 只允许配合 127.0.0.1 绑定使用`,
  PER_CONVO_DOCKER: `# 在宿主机跑 Canvas，但让每个会话进入独立加固容器
# 容器默认：非 root、cap-drop ALL、no-new-privileges、仅监听 127.0.0.1
export OH_CONVERSATION_RUNTIME=docker
export OH_CONVERSATION_IMAGE=ghcr.io/openhands/agent-server:latest-python
agent-canvas

# 可选：允许每个会话自行选择 Local / Docker 运行时
# export OH_CONVERSATION_RUNTIME_SELECTABLE=1
# 资源默认值：内存 4g、CPU 2.0、PID 512、空闲 1200 秒后回收容器`,
  VM_SYSTEMD: `# 在一台防火墙只放行 SSH/443 的 VM 上：
export LOCAL_BACKEND_API_KEY="$(openssl rand -base64 32)"  # 立即保存到密钥管理器
npx @openhands/agent-canvas --public

# /etc/systemd/system/agent-canvas.service
# [Service]
# Environment=LOCAL_BACKEND_API_KEY=<your-key>
# ExecStart=npx @openhands/agent-canvas --public
# Restart=on-failure
# RestartSec=5
# 公网访问再叠加 nginx + Let's Encrypt；--public 模式不会把 key 注入页面`,
  UPDATE_BACKUP: `# 升级（状态在包 / 镜像之外，升级不动数据）
docker pull ghcr.io/openhands/agent-canvas:1.43.0   # 固定 tag
docker stop <container> && docker run …            # 复用 openhands-data 卷

# 备份：状态卷 + 项目目录；先记录版本号再动
docker run --rm -v openhands-data:/from:ro -v "$PWD/backup:/to" \
  alpine sh -c 'cd /from && tar czf /to/openhands-data-$(date +%F).tgz .'

# 找回 Docker 自动生成的会话密钥（UI 要求输入 key 时）
docker exec <container> cat /home/openhands/.openhands/agent-canvas/api-key.txt`,
  VERIFY_ISOLATION: `# 在“每会话 Docker”模式下，让 Agent 执行：
id
printf 'PWD=%s\\nHOME=%s\\n' "$PWD" "$HOME"
# 期望：PWD=/workspace，HOME=/var/openhands/.openhands（不是宿主 home）

# 宿主侧复核容器加固：
docker ps --filter name=agent-server-conversation-
docker inspect <id> --format '{{.HostConfig.CapDrop}} {{.HostConfig.SecurityOpt}} {{.HostConfig.PortBindings}}'
# 期望：CapDrop=[ALL]、no-new-privileges、端口只绑 127.0.0.1`,
}

const enCode = {
  NPM_INSTALL: `# Check both hard prerequisites first: Node.js >= 24 and uv
node --version    # Must be >= v24; this verification sandbox has v20 and cannot start the stack
uv --version      # Required by the local Agent Server through uv/uvx

npm install -g @openhands/agent-canvas
agent-canvas --version   # Expected output: 1.43.0
agent-canvas --info      # Inspect version and stack configuration
agent-canvas             # Start the full stack and open http://localhost:8000`,
  DOCKER_RUN: `# Pin the tag instead of latest; the official troubleshooting guide records latest images missing files and crash-looping
mkdir -p ~/projects

docker run -it \
  --restart unless-stopped \
  -p 127.0.0.1:8000:8000 \
  -e AGENT_CANVAS_ALLOW_LAN_SESSION_KEY=true \
  -v openhands-data:/home/openhands/.openhands \
  -v "$HOME/projects:/projects" \
  ghcr.io/openhands/agent-canvas:1.43.0

# Open http://localhost:8000/canvas in a browser
# Use AGENT_CANVAS_ALLOW_LAN_SESSION_KEY only with a 127.0.0.1 binding`,
  PER_CONVO_DOCKER: `# Run Canvas on the host while placing every conversation in its own hardened container
# Container defaults: non-root, cap-drop ALL, no-new-privileges, and loopback-only listening
export OH_CONVERSATION_RUNTIME=docker
export OH_CONVERSATION_IMAGE=ghcr.io/openhands/agent-server:latest-python
agent-canvas

# Optional: allow each conversation to choose a Local / Docker runtime
# export OH_CONVERSATION_RUNTIME_SELECTABLE=1
# Resource defaults: 4g memory, 2.0 CPUs, 512 PIDs, and container reclamation after 1200 idle seconds`,
  VM_SYSTEMD: `# On a VM whose firewall allows only SSH/443:
export LOCAL_BACKEND_API_KEY="$(openssl rand -base64 32)"  # Save this in a secret manager immediately
npx @openhands/agent-canvas --public

# /etc/systemd/system/agent-canvas.service
# [Service]
# Environment=LOCAL_BACKEND_API_KEY=<your-key>
# ExecStart=npx @openhands/agent-canvas --public
# Restart=on-failure
# RestartSec=5
# Add nginx + Let's Encrypt for public access; --public mode does not inject the key into the page`,
  UPDATE_BACKUP: `# Upgrade: state lives outside the package / image, so upgrades do not move data
docker pull ghcr.io/openhands/agent-canvas:1.43.0   # Pin the tag
docker stop <container> && docker run …            # Reuse the openhands-data volume

# Backup: state volume + project directory; record the version before making changes
docker run --rm -v openhands-data:/from:ro -v "$PWD/backup:/to" \
  alpine sh -c 'cd /from && tar czf /to/openhands-data-$(date +%F).tgz .'

# Recover the Docker-generated session key when the UI asks for a key
docker exec <container> cat /home/openhands/.openhands/agent-canvas/api-key.txt`,
  VERIFY_ISOLATION: `# In per-conversation Docker mode, ask the Agent to execute:
id
printf 'PWD=%s\\nHOME=%s\\n' "$PWD" "$HOME"
# Expected: PWD=/workspace and HOME=/var/openhands/.openhands, not the host home

# Verify container hardening from the host:
docker ps --filter name=agent-server-conversation-
docker inspect <id> --format '{{.HostConfig.CapDrop}} {{.HostConfig.SecurityOpt}} {{.HostConfig.PortBindings}}'
# Expected: CapDrop=[ALL], no-new-privileges, and ports bound only to 127.0.0.1`,
}

export const openHandsCode = { zh: zhCode, en: enCode }
