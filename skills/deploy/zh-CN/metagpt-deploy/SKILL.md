---
name: metagpt-deploy
description: 在固定 v0.8.1 源码上部署或核验 MetaGPT，包含已实测的 Python 3.11 兼容组合、文档先行与完整生成路线、序列化恢复、密钥和执行隔离、外层自动化门禁、验收、故障、升级与备份。用于研究角色化 SOP 软件生产流水线；不用于未审批需求、生产直写或无人值守合并。
---

# MetaGPT v0.8.1 部署与核验

## 0. 版本合同与证据边界

- 官方仓库：`https://github.com/FoundationAgents/MetaGPT`
- 固定版本：`v0.8.1`
- 固定提交：`c036574507e7616c02512e7c8ad88dd847783afa`
- 官方许可证：MIT。
- 官方安装声明：Python 3.9+；本手册实际只核验 Python 3.11。
- 核验日期：2026-11-23；核验等级 B，只覆盖源码、依赖、编译、核心导入与 CLI 帮助。
- 未执行真实模型调用、项目生成、生成代码、QA、Team 恢复、论文或 benchmark。

本次真实结果：

1. 原始 `requirements.txt` 中的 `lancedb==0.4.0` 在 PyPI 官方索引和当前镜像均不可解析，原始安装失败。
2. 仅在临时 requirements 副本中替换为 `lancedb==0.14.0` 后，依赖安装和 `--no-deps` 包安装完成。
3. `compileall` 与 `generate_repo`、`Team`、`Message`、`Document` 核心导入通过。
4. 新解析的 `click==8.5.1` 使 `metagpt --help` 报 `Secondary flag is not valid for non-boolean flag`；固定 `click==8.1.7` 后通过。
5. 固定 `huggingface-hub==0.30.2` 消除其与 Click 8.1.7 的间接冲突。
6. `pip check` 仍必须报告：`metagpt 0.8.1 has requirement lancedb==0.4.0, but you have lancedb 0.14.0.` 这是已知兼容偏差，不得写成完全干净通过。

## 1. 硬性前置检查

- 使用专用运行账户和可丢弃目录；不要在个人主目录或生产仓库直接实验。
- 准备 Python 3.11、Git 和足够磁盘；完整生成还需模型 provider 的独立预算与超时。
- 不需要常驻端口。MetaGPT 是 CLI / Python 库，不是默认 Web 服务。
- 真实模型 key 由本地密钥流程写入受限 `config2.yaml`；不得放进 Git、命令行、日志、消息、state 或下载手册。
- 完整生成和 QA 只能放在一次性 VM 或等效隔离环境。MetaGPT 的 Environment 只是消息协作环境，不是沙箱。
- 不挂载宿主 Docker socket，不授予 push、merge、生产部署或 Issue 关闭权限。
- Mermaid CLI、Playwright、pyppeteer 只用于可选图表；不要为核心流程在宿主全局安装浏览器工具。

建议目录：

```text
/srv/agent-factory/
├── vendor/MetaGPT/       # 固定源码与 .venv
├── run-home/.metagpt/    # 独立、限权的 config2.yaml
├── workspace/            # 可丢弃产物；默认实际位于项目根下时需显式管理
├── runs/                 # 审批、命令、依赖与产物指纹
└── ci-copies/            # 外层独立验收副本
```

## 2. 路线选择

| 路线 | 用途 | 模型调用 | 代码执行 | 本手册实测状态 |
| --- | --- | --- | --- | --- |
| A · 离线核验 | 固定源码、编译、导入、CLI | 否 | 仅源码编译与帮助 | 已按兼容组合执行 |
| B · 文档先行 | PRD、设计、任务，不生成代码 | 是 | 不雇佣 Engineer / QA | 未执行 |
| C · 完整生成 | 编码、评审、可选 QA | 是 | 是，QA 会执行生成测试 | 未执行 |
| D · 序列化恢复 | 从已有 Team 状态继续 | 通常是 | 取决于原开关 | 未执行 |

先 A，再 B；只有在一次性隔离环境、预算、备份和外层 CI 都准备好后才考虑 C。D 不是绕过验收的捷径。

## 3. 路线 A：固定源码与兼容安装

```bash
mkdir -p /srv/agent-factory/vendor
cd /srv/agent-factory/vendor
git clone --depth 1 --branch v0.8.1 https://github.com/FoundationAgents/MetaGPT.git
cd MetaGPT
git rev-parse HEAD
# 必须输出 c036574507e7616c02512e7c8ad88dd847783afa

python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip

cp requirements.txt /tmp/metagpt-v081-requirements.txt
sed -i 's/^lancedb==0.4.0$/lancedb==0.14.0/' /tmp/metagpt-v081-requirements.txt
python -m pip install -r /tmp/metagpt-v081-requirements.txt
python -m pip install --no-deps -e .
python -m pip install click==8.1.7 huggingface-hub==0.30.2

python -m compileall -q metagpt
python -m pip freeze > /srv/agent-factory/runs/metagpt-v081-pip-freeze.txt
```

这是兼容实验，不是官方支持的新依赖锁。不得修改固定源码来掩盖偏差；所有替换只发生在临时 requirements 副本和虚拟环境中。

## 4. 离线配置、核心导入与 CLI 自检

模块导入会初始化配置，`YOUR_API_KEY` 会被拒绝。离线自检使用独立 HOME 和无网络占位配置，不能把它用于真实模型运行。

```bash
export META_RUN_HOME=/srv/agent-factory/run-home
mkdir -p "$META_RUN_HOME/.metagpt"
cat > "$META_RUN_HOME/.metagpt/config2.yaml" <<'YAML'
llm:
  api_type: openai
  model: offline-verification-model
  base_url: http://127.0.0.1:9/v1
  api_key: offline-verification-placeholder
YAML
chmod 600 "$META_RUN_HOME/.metagpt/config2.yaml"

HOME="$META_RUN_HOME" python -c 'from importlib.metadata import version; from metagpt.software_company import generate_repo; from metagpt.team import Team; from metagpt.schema import Message, Document; print(version("metagpt")); print("core imports passed")'
HOME="$META_RUN_HOME" metagpt --help
python -m pip check || true
```

最后一条必须人工核对输出：只允许出现前述 LanceDB 声明偏差；如果出现其他冲突，停止并记录，不得用 `|| true` 把它们当作通过。真实运行前替换整个独立 HOME 的配置，不沿用离线占位值。

## 5. 真实模型配置

官方入口可初始化 `~/.metagpt/config2.yaml`；已有文件会先改名为 `.bak`。在专用运行账户下执行：

```bash
HOME=/srv/agent-factory/run-home metagpt --init-config
chmod 600 /srv/agent-factory/run-home/.metagpt/config2.yaml
```

由本地密钥流程编辑配置：

```yaml
llm:
  api_type: "openai"
  model: "选择账户实际可用的模型"
  base_url: "https://api.openai.com/v1"
  api_key: "由本地密钥管理流程写入"
```

配置读取顺序中，home 的 `~/.metagpt/config2.yaml` 覆盖项目内 `config/config2.yaml`。不要同时在多个位置遗留不同真实 key。运行前只检查文件权限和配置字段存在性，不打印密钥。

## 6. 路线 B：文档先行

官方默认开启实现与代码评审，所以必须同时关闭它们：

```bash
cd /srv/agent-factory/vendor/MetaGPT
source .venv/bin/activate
HOME=/srv/agent-factory/run-home metagpt "Write a CLI snake game" \
  --project-name approved_snake_docs \
  --no-implement --no-code-review --no-run-tests \
  --investment 1 --n-round 5
```

预期只组装 ProductManager、Architect 和 ProjectManager，生成需求、PRD、系统设计和任务等文档。真实运行会调用模型并写 workspace；本手册未声称已执行。检查：

```bash
find workspace/approved_snake_docs -maxdepth 4 -type f | sort
```

没有产物、结构化输出解析失败或预算耗尽时，保留日志并停止；不要直接开启实现来“补偿”文档失败。

## 7. 路线 C：隔离完整生成与可选 QA

仅在一次性 VM 或等效隔离环境内执行。使用专用需求、低预算、较少轮次和外层进程超时：

```bash
HOME=/srv/agent-factory/run-home timeout 30m metagpt "Write a CLI snake game" \
  --project-name approved_snake_full \
  --implement --code-review --run-tests \
  --investment 1 --n-round 8
```

边界：

- 官方默认 `implement=true`、`code_review=true`、`run_tests=false`。
- `--run-tests` 会雇佣 QaEngineer，写测试、运行 Python 测试并根据结果调试。
- 不直接同步 workspace 到生产；先复制到 `ci-copies/`，运行干净 CI、安全扫描和人工评审。
- 官方 Docker 文档中的 `--privileged` 不被本手册采用。当前固定依赖也无法直接证明官方镜像可重复构建。

## 8. 路线 D：序列化恢复

官方恢复路径必须存在且以 `team` 结尾。恢复前备份 `team.json`、角色状态、ProjectRepo、配置和依赖指纹：

```bash
cp -a workspace/storage/team /srv/agent-factory/runs/team-backup-before-recovery
HOME=/srv/agent-factory/run-home metagpt \
  --recover-path workspace/storage/team \
  --investment 1 --n-round 3
```

恢复会从 Team 读取原 idea。模型、配置、文件或预算变化都可能改变结果；恢复不是幂等重放。本路线未实测，完成后仍需外层 CI 与人审。

## 9. 外层自动化接入门禁

原生 CLI 不是 GitHub Issue 监听器。外层调度器必须：

1. 只接收维护者批准的需求，过滤未审核公开文本。
2. 固定版本、参数数组、独立 HOME、workspace、预算、轮次与超时；不用 `shell=True`。
3. 收集退出码、配置指纹、消息、Team 状态、文件树、测试输出和产物哈希。
4. 把只读产物副本送入干净 CI、密钥扫描和漏洞扫描。
5. 仅由受控流程创建分支或 PR；MetaGPT 不获得 push、merge、部署或关闭 Issue 权限。

文档先行示例：

```python
from pathlib import Path
import os
import subprocess

root = Path("/srv/agent-factory")
command = [
    str(root / "vendor/MetaGPT/.venv/bin/metagpt"),
    "Create a CLI snake game",
    "--project-name", "approved_snake_docs",
    "--no-implement", "--no-code-review", "--no-run-tests",
    "--investment", "1", "--n-round", "5",
]
subprocess.run(
    command,
    cwd=root / "vendor/MetaGPT",
    env={**os.environ, "HOME": str(root / "run-home")},
    timeout=1800,
    check=True,
)
```

## 10. 验收闸门

- [ ] `git rev-parse HEAD` 与固定提交完全一致。
- [ ] 保存 `pip freeze`、临时 requirements 差异与 Python 版本。
- [ ] `compileall`、核心导入和 `metagpt --help` 的实际输出已保存。
- [ ] `pip check` 只含已审阅的 LanceDB 偏差；其他冲突为零。
- [ ] 真实 key 不在 Git、命令行、日志、消息、state 或产物中。
- [ ] 首次真实运行为文档先行，低预算、少轮次、独立 HOME 和可丢弃 workspace。
- [ ] 完整生成与 QA 只在一次性隔离环境执行，无 Docker socket 或生产凭据。
- [ ] 产物在干净副本中通过项目 CI、安全扫描、文件清单和人工评审后才进入 PR。

## 11. 故障速查

### `No matching distribution for lancedb==0.4.0`

这是本次真实失败。按路线 A 使用临时副本替换为 0.14.0；保留 pip check 偏差，不声称官方原始安装通过。

### `Secondary flag is not valid for non-boolean flag`

这是 Typer 0.9.0 与新 Click 的真实兼容失败。固定 `click==8.1.7`；若 Hub 2.x 冲突，使用本次 `huggingface-hub==0.30.2`，再运行 CLI 和 pip check。

### 导入时 `Please set your API key in config2.yaml`

配置在模块导入时初始化。离线核验使用无网络占位配置；真实运行由密钥流程写独立 home 配置，不打印真实 key。

### 文档路线开始写代码

检查是否同时传了 `--no-implement --no-code-review --no-run-tests`。只关闭测试不会关闭 Engineer。

### QA 没有执行

官方默认 `run_tests=false`。只有隔离环境准备好后才显式添加 `--run-tests`，并检查 `tests/` 与 `test_outputs/`。

### workspace 或配置权限错误

使用专用账户、独立 HOME 和受控项目目录；检查 `config2.yaml`、`.bak`、workspace 与恢复路径。不要从不明归档复制配置。

### Mermaid 图表失败

先验收核心文档与代码。确需图表时再选择 Mermaid CLI、Playwright 或 pyppeteer 之一并固定浏览器；不要在生产宿主全局安装可选工具。

## 12. 升级、备份与安全红线

升级：

1. 保存旧 tag、commit、Python、pip freeze、兼容差异、配置备份和产物哈希。
2. 检查 provider、Pydantic、Typer、Click、LanceDB 与配置格式变化。
3. 用同一批准需求比较新旧版本的角色、产物、成本、失败和人工评审结果。
4. 新路线完成 A、B、隔离 C 验收前保留旧环境。

备份：备份 Team、ProjectRepo、命令、模型与依赖指纹，不备份明文 key；设置磁盘配额、脱敏和保留期。同时限制 investment、n_round、进程超时与 provider 预算。

安全红线：不把 Environment 当沙箱；不运行未审批需求；不在生产宿主执行生成测试；不挂载 Docker socket；不自动 push、merge、部署或关闭 Issue。

## 13. 官方来源

- `https://github.com/FoundationAgents/MetaGPT`
- `https://github.com/FoundationAgents/MetaGPT/releases/tag/v0.8.1`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/README.md`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/setup.py`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/requirements.txt`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/metagpt/software_company.py`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/metagpt/team.py`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/metagpt/roles/role.py`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/metagpt/environment/base_env.py`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/metagpt/schema.py`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/metagpt/utils/project_repo.py`
- `https://github.com/FoundationAgents/MetaGPT/blob/v0.8.1/docs/tutorial/usage.md`
- `https://arxiv.org/abs/2308.00352`
