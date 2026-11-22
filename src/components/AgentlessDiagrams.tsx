import { ArrowDown, ArrowLeft, ArrowRight, Check, Database, FileJson, GitBranch, KeyRound, ListChecks, RotateCcw, ShieldAlert, TestTube2, Wrench, type LucideIcon } from 'lucide-react'

export function AgentlessArchitectureDiagram() {
  return <figure className="paper-diagram architecture-diagram">
    <div className="diagram-topline"><span>图 1 · 无 Agent 的三段式架构</span><span>固定流程替代自主工具循环</span></div>
    <div className="arch-grid">
      <div className="arch-column input-column">
        <span className="diagram-label">输入 / 边界</span>
        <div className="diagram-box yellow"><GitBranch /><strong>Issue 与仓库结构</strong><small>SWE-bench 实例<br />repo + base_commit<br />可指定 target_id</small></div>
        <div className="diagram-box pink"><KeyRound /><strong>宿主侧密钥</strong><small>OPENAI_API_KEY<br />可选 DeepSeek API<br />不进 Git 与日志</small></div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-core">
        <span className="diagram-label">Agentless 固定流水线</span>
        <div className="core-loop">
          <div className="diagram-box blue"><span className="box-index">1</span><strong>层级定位</strong><small>文件级 LLM + 检索合并<br />相关类 / 函数 / 全局变量<br />细粒度编辑区间</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>locations <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> context</span></div>
          <div className="diagram-box green"><span className="box-index">2</span><strong>多样本修复</strong><small>按定位上下文生成补丁<br />edit_file 或 SEARCH/REPLACE<br />解析、语法检查、归一化</small></div>
          <div className="loop-arrows" aria-hidden="true"><span>candidates <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> results</span></div>
          <div className="diagram-box yellow"><span className="box-index">3</span><strong>验证与选择</strong><small>回归测试筛选与执行<br />复现测试生成与过滤<br />去重后多数投票</small></div>
        </div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column">
        <span className="diagram-label">输出 / 外部验收</span>
        <div className="diagram-box green"><Check /><strong>all_preds.jsonl</strong><small>每个 instance 一个入选补丁<br />model_name_or_path=agentless<br />交给 SWE-bench / CI</small></div>
        <div className="diagram-box blue"><FileJson /><strong>JSONL 证据链</strong><small>loc_outputs / output.jsonl<br />test_results / logs<br />成本统计输入</small></div>
      </div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>边界外：</strong>Agentless 不内建 Issue 队列、沙箱调度、权限审批、密钥管理或合并闸门；这些必须由外层软件工厂补齐。</div>
    <figcaption>核心思想不是让模型自由决定下一步，而是把“定位 → 修复 → 验证选择”写成可审计的固定程序。</figcaption>
  </figure>
}

const flowSteps = [
  ['01', '读取实例', '从 SWE-bench Lite / Verified 读取 problem_statement、repo 与 base_commit；可用 target_id 缩小范围。'],
  ['02', '定位文件', 'LLM 预测可疑文件，再用无关目录过滤与 embedding 检索补齐，合并成最终文件列表。'],
  ['03', '定位元素与行', '在 top_n 文件中找相关类、函数和全局变量，再采样多组细粒度编辑位置。'],
  ['04', '生成补丁', '每组编辑位置生成 1 个贪心样本与多个温度样本；v1.5.0 文档示例合计 40 个候选。'],
  ['05', '执行验证', '先选出原始仓库中通过的回归测试，再生成并筛选能复现问题的测试。'],
  ['06', '投票提交', '按回归失败数与复现测试通过状态过滤，归一化去重后多数投票写入 all_preds.jsonl。'],
]

export function AgentlessWorkflowDiagram() {
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>图 2 · 单实例闭环</span><span>固定阶段 + 多样本，而不是自由工具循环</span></div>
    <ol className="workflow-steps">
      {flowSteps.map(([number, title, text], index) => <li key={number} className={['yellow', 'blue', 'pink', 'green', 'blue', 'yellow'][index]}>
        <span className="flow-number">{number}</span><strong>{title}</strong><p>{text}</p>{index < flowSteps.length - 1 && <ArrowDown className="flow-down" aria-hidden="true" />}
      </li>)}
    </ol>
    <div className="loop-back"><RotateCcw className="loop-back-icon" aria-hidden="true" /><span>定位无效时</span><strong>同阶段提高温度重试，不改成自由探索</strong></div>
    <figcaption>官方流程默认 SWE-bench Lite；README_swebench.md 同时给出 SWE-bench Verified 的 --dataset 参数。</figcaption>
  </figure>
}

export function AgentlessDataEventDiagram() {
  const events = [
    ['loc', '定位结果', 'loc_outputs.jsonl 保存 found_files、found_related_locs、found_edit_locs 与轨迹。'],
    ['repair', '候选补丁', 'output.jsonl 保存每个样本的原始输出、token 统计与后处理 diff。'],
    ['regression', '回归结果', 'output_i_regression_test_results.jsonl 记录失败测试列表；越少越好。'],
    ['reproduction', '复现结果', 'output_i_reproduction_test_results.jsonl 标记补丁是否通过选定复现测试。'],
    ['rerank', '最终预测', 'all_preds.jsonl 只保留每个 instance 的一个 model_patch。'],
  ]
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>图 3 · 数据与证据流</span><span>JSONL 是各阶段之间唯一稳定接口</span></div>
    <div className="event-layout">
      <ol className="event-stream">{events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 4 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><Database /><strong>results/&lt;benchmark&gt;/</strong><code>file_level/loc_outputs.jsonl<br />file_level_combined/combined_locs.jsonl<br />repair_sample_i/output.jsonl<br />repair_sample_i/*_test_results.jsonl<br />reproduction_tests.jsonl<br />all_preds.jsonl</code><p>结果文件可能包含私有源码、绝对路径、模型输出与成本数据；接入工厂时限权、脱敏并设置保留期。</p></div>
    </div>
    <figcaption>patch validation 不是最终评测；all_preds.jsonl 仍需交给 SWE-bench harness 或项目 CI 独立验收。</figcaption>
  </figure>
}

export function AgentlessDeploymentDiagram() {
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>图 4 · 部署路线</span><span>先固定依赖，再决定是否进入真实基准</span></div>
    <div className="deployment-lanes">
      <div className="deploy-lane yellow"><span className="lane-tag">A · 兼容环境</span><h3>Python 3.11 + 版本锁定</h3><div className="lane-flow"><span>v1.5.0 源码</span><ArrowRight size={12} aria-hidden="true" /><span>pip check</span><ArrowRight size={12} aria-hidden="true" /><span>CLI 自检</span></div><p>官方 requirements 未锁版本；本次实测需把 swebench 固定到 2.1.8、modal 固定到 0.77.0，才能让全部入口通过帮助命令检查。</p></div>
      <div className="deploy-lane green"><span className="lane-tag">B · 单实例烟测</span><h3>target_id + 小样本文档流程</h3><div className="lane-flow"><span>一个 Issue</span><ArrowRight size={12} aria-hidden="true" /><span>定位与修复</span><ArrowRight size={12} aria-hidden="true" /><span>候选 JSONL</span></div><p>先用 --target_id、较低 max_samples 和可丢弃仓库验证输入输出；模型调用与真实修复本页未声称已执行。</p></div>
      <div className="deploy-lane blue"><span className="lane-tag">C · 基准批处理</span><h3>Lite / Verified + 外层评测</h3><div className="lane-flow"><span>数据集</span><ArrowRight size={12} aria-hidden="true" /><span>并发阶段</span><ArrowRight size={12} aria-hidden="true" /><span>SWE-bench</span></div><p>官方文档示例会生成 40 个修复候选与 40 个复现测试样本；成本、磁盘与评测并发需要先设上限。</p></div>
    </div>
    <figcaption>Agentless 本身不是执行沙箱；真实仓库命令执行、依赖安装与 CI 必须放在外层受控环境中。</figcaption>
  </figure>
}

export function AgentlessSelectionDiagram() {
  const steps: { title: string; text: string; Icon: LucideIcon }[] = [
    { title: '候选补丁', text: '多组定位 × 每个位置多样本', Icon: Wrench },
    { title: '归一化去重', text: 'normalize_patch 合并等价补丁', Icon: FileJson },
    { title: '回归过滤', text: '失败测试数最少的候选优先', Icon: ListChecks },
    { title: '复现过滤', text: '通过选定复现测试者优先', Icon: TestTube2 },
    { title: '多数投票', text: '票数优先，平票取更早且更短补丁', Icon: Check },
  ]
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>图 5 · 补丁选择</span><span>rerank.py 只做选择，不证明业务正确</span></div>
    <div className="factory-conveyor" aria-label="Agentless 补丁验证与选择流水线">
      {steps.map(({ title, text, Icon }) => <div key={title} className="conveyor-step internal"><span>Agentless</span><Icon /><strong>{title}</strong><p>{text}</p></div>)}
    </div>
    <figcaption>若没有候选同时通过回归与复现，代码会退回仅看回归结果；最终仍需要外部 CI 与人工审阅。</figcaption>
  </figure>
}
