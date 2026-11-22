import { Fragment } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Check, Database, FileJson, GitBranch, KeyRound, RotateCcw, ShieldAlert } from 'lucide-react'
import type { Locale } from '../locale'

const copy = {
  zh: {
    architecture: {
      topLeft: '图 1 · 无 Agent 的三段式架构', topRight: '固定流程替代自主工具循环', inputLabel: '输入 / 边界',
      issueTitle: 'Issue 与仓库结构', issueLines: ['SWE-bench 实例', 'repo + base_commit', '可指定 target_id'],
      secretTitle: '宿主侧密钥', secretLines: ['OPENAI_API_KEY', '可选 DeepSeek API', '不进 Git 与日志'], coreLabel: 'Agentless 固定流水线',
      localizeTitle: '层级定位', localizeLines: ['文件级 LLM + 检索合并', '相关类 / 函数 / 全局变量', '细粒度编辑区间'],
      repairTitle: '多样本修复', repairLines: ['按定位上下文生成补丁', 'edit_file 或 SEARCH/REPLACE', '解析、语法检查、归一化'],
      validateTitle: '验证与选择', validateLines: ['回归测试筛选与执行', '复现测试生成与过滤', '去重后多数投票'], outputLabel: '输出 / 外部验收',
      outputLines: ['每个 instance 一个入选补丁', 'model_name_or_path=agentless', '交给 SWE-bench / CI'],
      evidenceTitle: 'JSONL 证据链', evidenceLines: ['loc_outputs / output.jsonl', 'test_results / logs', '成本统计输入'],
      boundaryLead: '边界外：', boundaryBody: 'Agentless 不内建 Issue 队列、沙箱调度、权限审批、密钥管理或合并闸门；这些必须由外层软件工厂补齐。',
      caption: '核心思想不是让模型自由决定下一步，而是把“定位 → 修复 → 验证选择”写成可审计的固定程序。',
    },
    workflow: {
      topLeft: '图 2 · 单实例闭环', topRight: '固定阶段 + 多样本，而不是自由工具循环',
      steps: [
        ['读取实例', '从 SWE-bench Lite / Verified 读取 problem_statement、repo 与 base_commit；可用 target_id 缩小范围。'],
        ['定位文件', 'LLM 预测可疑文件，再用无关目录过滤与 embedding 检索补齐，合并成最终文件列表。'],
        ['定位元素与行', '在 top_n 文件中找相关类、函数和全局变量，再采样多组细粒度编辑位置。'],
        ['生成补丁', '每组编辑位置生成 1 个贪心样本与多个温度样本；v1.5.0 文档示例合计 40 个候选。'],
        ['执行验证', '先选出原始仓库中通过的回归测试，再生成并筛选能复现问题的测试。'],
        ['投票提交', '按回归失败数与复现测试通过状态过滤，归一化去重后多数投票写入 all_preds.jsonl。'],
      ],
      loopLabel: '定位无效时', loopText: '同阶段提高温度重试，不改成自由探索', caption: '官方流程默认 SWE-bench Lite；README_swebench.md 同时给出 SWE-bench Verified 的 --dataset 参数。',
    },
    data: {
      topLeft: '图 3 · 数据与证据流', topRight: 'JSONL 是各阶段之间唯一稳定接口',
      events: [
        ['loc', '定位结果', 'loc_outputs.jsonl 保存 found_files、found_related_locs、found_edit_locs 与轨迹。'],
        ['repair', '候选补丁', 'output.jsonl 保存每个样本的原始输出、token 统计与后处理 diff。'],
        ['regression', '回归结果', 'output_i_regression_test_results.jsonl 记录失败测试列表；越少越好。'],
        ['reproduction', '复现结果', 'output_i_reproduction_test_results.jsonl 标记补丁是否通过选定复现测试。'],
        ['rerank', '最终预测', 'all_preds.jsonl 只保留每个 instance 的一个 model_patch。'],
      ],
      note: '结果文件可能包含私有源码、绝对路径、模型输出与成本数据；接入工厂时限权、脱敏并设置保留期。', caption: 'patch validation 不是最终评测；all_preds.jsonl 仍需交给 SWE-bench harness 或项目 CI 独立验收。',
    },
    deployment: {
      topLeft: '图 4 · 部署路线', topRight: '先固定依赖，再决定是否进入真实基准',
      lanes: [
        { tag: 'A · 兼容环境', title: 'Python 3.11 + 版本锁定', flow: ['v1.5.0 源码', 'pip check', 'CLI 自检'], body: '官方 requirements 未锁版本；本次实测需把 swebench 固定到 2.1.8、modal 固定到 0.77.0，才能让全部入口通过帮助命令检查。' },
        { tag: 'B · 单实例烟测', title: 'target_id + 小样本文档流程', flow: ['一个 Issue', '定位与修复', '候选 JSONL'], body: '先用 --target_id、较低 max_samples 和可丢弃仓库验证输入输出；模型调用与真实修复本页未声称已执行。' },
        { tag: 'C · 基准批处理', title: 'Lite / Verified + 外层评测', flow: ['数据集', '并发阶段', 'SWE-bench'], body: '官方文档示例会生成 40 个修复候选与 40 个复现测试样本；成本、磁盘与评测并发需要先设上限。' },
      ],
      caption: 'Agentless 本身不是执行沙箱；真实仓库命令执行、依赖安装与 CI 必须放在外层受控环境中。',
    },
  },
  en: {
    architecture: {
      topLeft: 'FIG 1 · THREE-PHASE ARCHITECTURE', topRight: 'A fixed pipeline replaces an autonomous tool loop', inputLabel: 'INPUT / BOUNDARY',
      issueTitle: 'Issue and repository structure', issueLines: ['SWE-bench instance', 'repo + base_commit', 'Optional target_id'],
      secretTitle: 'Host-side secrets', secretLines: ['OPENAI_API_KEY', 'Optional DeepSeek API', 'Never in Git or logs'], coreLabel: 'AGENTLESS FIXED PIPELINE',
      localizeTitle: 'Hierarchical localization', localizeLines: ['File-level LLM + retrieval merge', 'Related classes / functions / globals', 'Fine-grained edit intervals'],
      repairTitle: 'Multi-sample repair', repairLines: ['Patches from localized context', 'edit_file or SEARCH/REPLACE', 'Parsing, syntax checks, normalization'],
      validateTitle: 'Validation and selection', validateLines: ['Regression test selection / execution', 'Reproduction test generation / filtering', 'Majority vote after deduplication'], outputLabel: 'OUTPUT / EXTERNAL ACCEPTANCE',
      outputLines: ['One selected patch per instance', 'model_name_or_path=agentless', 'Handed to SWE-bench / CI'],
      evidenceTitle: 'JSONL evidence chain', evidenceLines: ['loc_outputs / output.jsonl', 'test_results / logs', 'Cost-statistics inputs'],
      boundaryLead: 'Outside the boundary:', boundaryBody: ' Agentless does not provide an Issue queue, sandbox scheduler, approval flow, secret management, or merge gate; an outer software factory must supply them.',
      caption: 'The key idea is not free model-driven tool choice. It is an auditable fixed sequence: localize, repair, then validate and select.',
    },
    workflow: {
      topLeft: 'FIG 2 · SINGLE-INSTANCE LOOP', topRight: 'Fixed phases plus sampling, not free exploration',
      steps: [
        ['Read the instance', 'Load problem_statement, repo, and base_commit from SWE-bench Lite / Verified; target_id can narrow the run.'],
        ['Localize files', 'LLM-predicted suspicious files are complemented by irrelevant-folder filtering and embedding retrieval.'],
        ['Localize elements and lines', 'Find related classes, functions, and globals in top_n files, then sample several fine-grained edit-location sets.'],
        ['Generate patches', 'Each edit-location set produces one greedy sample plus temperature samples; the v1.5.0 guide example yields 40 candidates.'],
        ['Run validation', 'Select regression tests that pass on the original repository, then generate and filter tests that reproduce the issue.'],
        ['Vote and submit', 'Filter by regression failures and reproduction results, deduplicate normalized patches, and write all_preds.jsonl.'],
      ],
      loopLabel: 'When localization is invalid', loopText: 'Retry the same phase at a higher temperature instead of wandering', caption: 'The official flow defaults to SWE-bench Lite; README_swebench.md also documents the SWE-bench Verified --dataset option.',
    },
    data: {
      topLeft: 'FIG 3 · DATA & EVIDENCE FLOW', topRight: 'JSONL is the stable interface between phases',
      events: [
        ['loc', 'Localization results', 'loc_outputs.jsonl stores found_files, found_related_locs, found_edit_locs, and trajectories.'],
        ['repair', 'Candidate patches', 'output.jsonl stores raw sample output, token statistics, and post-processed diffs.'],
        ['regression', 'Regression results', 'output_i_regression_test_results.jsonl records failed tests; fewer is better.'],
        ['reproduction', 'Reproduction results', 'output_i_reproduction_test_results.jsonl marks whether a patch passes the selected reproduction test.'],
        ['rerank', 'Final predictions', 'all_preds.jsonl keeps one model_patch per instance.'],
      ],
      note: 'Result files can contain private source, absolute paths, model output, and cost data; restrict, redact, and retain them deliberately.', caption: 'Patch validation is not final evaluation; all_preds.jsonl still needs the SWE-bench harness or project CI.',
    },
    deployment: {
      topLeft: 'FIG 4 · DEPLOYMENT ROUTES', topRight: 'Pin dependencies before attempting a real benchmark',
      lanes: [
        { tag: 'A · COMPATIBLE ENVIRONMENT', title: 'Python 3.11 + version pins', flow: ['v1.5.0 source', 'pip check', 'CLI smoke checks'], body: 'The official requirements are unpinned. In this verification, swebench==2.1.8 and modal==0.77.0 were required for every entry point to pass its help command.' },
        { tag: 'B · SINGLE-ISSUE SMOKE TEST', title: 'target_id + a small sample count', flow: ['One Issue', 'Localization and repair', 'Candidate JSONL'], body: 'Validate inputs and outputs first with --target_id, a lower max_samples value, and a disposable repository. No model call or real repair is claimed here.' },
        { tag: 'C · BENCHMARK BATCH', title: 'Lite / Verified + external evaluation', flow: ['Dataset', 'Concurrent phases', 'SWE-bench'], body: 'The official example generates 40 repair candidates and 40 reproduction-test samples; cap cost, disk, workers, and evaluation concurrency first.' },
      ],
      caption: 'Agentless is not an execution sandbox by itself. Real repository commands, dependency installation, and CI belong in a controlled outer environment.',
    },
  },
}

function Lines({ lines }: { lines: string[] }) {
  return <small>{lines.map((line, index) => <Fragment key={line}>{index > 0 && <br />}{line}</Fragment>)}</small>
}

export function AgentlessArchitectureDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].architecture
  return <figure className="paper-diagram architecture-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="arch-grid">
      <div className="arch-column input-column">
        <span className="diagram-label">{c.inputLabel}</span>
        <div className="diagram-box yellow"><GitBranch /><strong>{c.issueTitle}</strong><Lines lines={c.issueLines} /></div>
        <div className="diagram-box pink"><KeyRound /><strong>{c.secretTitle}</strong><Lines lines={c.secretLines} /></div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-core">
        <span className="diagram-label">{c.coreLabel}</span>
        <div className="core-loop">
          <div className="diagram-box blue"><span className="box-index">1</span><strong>{c.localizeTitle}</strong><Lines lines={c.localizeLines} /></div>
          <div className="loop-arrows" aria-hidden="true"><span>locations <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> context</span></div>
          <div className="diagram-box green"><span className="box-index">2</span><strong>{c.repairTitle}</strong><Lines lines={c.repairLines} /></div>
          <div className="loop-arrows" aria-hidden="true"><span>candidates <ArrowRight size={10} /></span><span><ArrowLeft size={10} /> results</span></div>
          <div className="diagram-box yellow"><span className="box-index">3</span><strong>{c.validateTitle}</strong><Lines lines={c.validateLines} /></div>
        </div>
      </div>
      <div className="arch-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="arch-column output-column">
        <span className="diagram-label">{c.outputLabel}</span>
        <div className="diagram-box green"><Check /><strong>all_preds.jsonl</strong><Lines lines={c.outputLines} /></div>
        <div className="diagram-box blue"><FileJson /><strong>{c.evidenceTitle}</strong><Lines lines={c.evidenceLines} /></div>
      </div>
    </div>
    <div className="diagram-boundary"><ShieldAlert size={18} /><strong>{c.boundaryLead}</strong>{c.boundaryBody}</div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function AgentlessWorkflowDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].workflow
  return <figure className="paper-diagram workflow-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <ol className="workflow-steps">{c.steps.map(([title, text], index) => <li key={title} className={['yellow', 'blue', 'pink', 'green', 'blue', 'yellow'][index]}>
      <span className="flow-number">{String(index + 1).padStart(2, '0')}</span><strong>{title}</strong><p>{text}</p>{index < c.steps.length - 1 && <ArrowDown className="flow-down" aria-hidden="true" />}
    </li>)}</ol>
    <div className="loop-back"><RotateCcw className="loop-back-icon" aria-hidden="true" /><span>{c.loopLabel}</span><strong>{c.loopText}</strong></div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function AgentlessDataEventDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].data
  return <figure className="paper-diagram data-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="event-layout">
      <ol className="event-stream">{c.events.map(([role, title, text], index) => <li key={`${role}-${index}`} className={index === 4 ? 'exit-event' : ''}><span className="event-role">{role}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
      <div className="trajectory-note"><Database /><strong>results/&lt;benchmark&gt;/</strong><code>file_level/loc_outputs.jsonl<br />file_level_combined/combined_locs.jsonl<br />repair_sample_i/output.jsonl<br />repair_sample_i/*_test_results.jsonl<br />reproduction_tests.jsonl<br />all_preds.jsonl</code><p>{c.note}</p></div>
    </div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}

export function AgentlessDeploymentDiagram({ locale }: { locale: Locale }) {
  const c = copy[locale].deployment
  return <figure className="paper-diagram deployment-diagram">
    <div className="diagram-topline"><span>{c.topLeft}</span><span>{c.topRight}</span></div>
    <div className="deployment-lanes">{c.lanes.map((lane, index) => <div className={`deploy-lane ${['yellow', 'green', 'blue'][index]}`} key={lane.tag}><span className="lane-tag">{lane.tag}</span><h3>{lane.title}</h3><div className="lane-flow"><span>{lane.flow[0]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[1]}</span><ArrowRight size={12} aria-hidden="true" /><span>{lane.flow[2]}</span></div><p>{lane.body}</p></div>)}</div>
    <figcaption>{c.caption}</figcaption>
  </figure>
}
