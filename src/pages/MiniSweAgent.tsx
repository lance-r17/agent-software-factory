import { Fragment, useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, ExternalLink, FileCheck2, GitPullRequest, Info, Layers3, PackageCheck, Shield, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { CodeBlock, SectionHeading, SourceLink, SourceStrip, copyText } from '../components/CodeBlock'
import { DeploySkillCard } from '../components/DeploySkill'
import { PageShell } from '../components/Layout'
import { RouteTabs } from '../components/RouteTabs'
import { ArchitectureDiagram, DataEventDiagram, DeploymentDiagram, WorkflowDiagram } from '../components/MiniDiagrams'
import { miniSweAgentDeploySkill } from '../data/deploySkills'
import { miniSweAgentDeploySkillEn } from '../data/deploySkillsEn'
import { miniSweContent } from '../data/solutionContent/miniSweContent'
import { miniSweCode } from '../data/solutionContent/miniSweCode'
import type { Locale } from '../locale'

const VERIFY_DATE = '2026-11-21'
const SOURCE_URLS = [
  'https://github.com/SWE-agent/mini-swe-agent', 'https://github.com/SWE-agent/mini-swe-agent/releases/tag/v2.4.6',
  'https://github.com/SWE-agent/mini-swe-agent/commits/main/', 'https://mini-swe-agent.com/latest/advanced/control_flow/',
  'https://mini-swe-agent.com/latest/advanced/environments/', 'https://mini-swe-agent.com/latest/advanced/yaml_configuration/',
  'https://mini-swe-agent.com/latest/advanced/global_configuration/', 'https://github.com/SWE-agent/mini-swe-agent/blob/main/pyproject.toml',
]
const ARCHITECTURE_URLS = [SOURCE_URLS[3], 'https://github.com/SWE-agent/mini-swe-agent/blob/main/src/minisweagent/agents/default.py', SOURCE_URLS[4]]
const COMPONENT_URLS = ['https://mini-swe-agent.com/latest/advanced/v2_migration/', 'https://mini-swe-agent.com/latest/usage/mini/', 'https://github.com/SWE-agent/mini-swe-agent/blob/main/src/minisweagent/run/mini.py']
const COMMAND_URLS = ['https://mini-swe-agent.com/latest/quickstart/', SOURCE_URLS[6], SOURCE_URLS[5], SOURCE_URLS[7]]

type Row = { chip: string; tone: string; input: string; role: string; boundary: string }
type LinkContent = { href: string; label: string }

function Inline({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/g).map((part, index) => part.startsWith('`') && part.endsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : <Fragment key={index}>{part}</Fragment>)}</>
}

function RoleTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: Row[] }) {
  return <div className="component-table-wrap"><table className="component-table"><caption className="sr-only">{caption}</caption><thead><tr>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>
    {rows.map(row => <tr key={row.chip}><th><span className={`component-chip ${row.tone}`}>{row.chip}</span></th><td>{row.input}</td><td>{row.role}</td><td>{row.boundary}</td></tr>)}
  </tbody></table></div>
}

function CopyPageLink({ copy, copied }: { copy: string; copied: string }) {
  const [wasCopied, setWasCopied] = useState(false)
  return <button type="button" className="copy-page-link" onClick={async () => { try { await copyText(window.location.href); setWasCopied(true); window.setTimeout(() => setWasCopied(false), 1600) } catch { setWasCopied(false) } }}>
    {wasCopied ? <Check size={16} /> : <ExternalLink size={16} />}{wasCopied ? copied : copy}
  </button>
}

function DeploymentTabs({ locale }: { locale: Locale }) {
  const c = miniSweContent[locale].deploy
  const code = miniSweCode[locale]
  const tabs = c.tabs.map(tab => ({ ...tab, yaml: code[tab.yamlCode as keyof typeof code], run: code[tab.runCode as keyof typeof code] }))
  return <RouteTabs tabs={tabs} initialId="local" ariaLabel={c.tabsAria}>
    {(current) => <><h3>{current.title}</h3><p>{current.note}</p><CodeBlock title={`${current.id}.yaml`} code={current.yaml} language="yaml" /><CodeBlock title={locale === 'en' ? `Run the ${current.id} route` : `运行 ${current.id} 路线`} code={current.run} /></>}
  </RouteTabs>
}

function OptionalSource({ source }: { source?: LinkContent }) {
  return source ? <SourceLink href={source.href}>{source.label}</SourceLink> : null
}

export default function MiniSweAgent({ locale }: { locale: Locale }) {
  const c = miniSweContent[locale]
  const code = miniSweCode[locale]
  const isEnglish = locale === 'en'
  const homePath = isEnglish ? '/en' : '/'
  const solutionPath = `${isEnglish ? '/en' : ''}/solutions/mini-swe-agent`
  const factoryIcons = [GitPullRequest, Layers3, FileCheck2, Shield]
  return <PageShell>
    <article className="detail-page mini-page">
      <header className="detail-hero page-width">
        <div className="breadcrumb"><Link to={homePath}><ArrowLeft size={16} /> {c.hero.breadcrumb}</Link><ChevronRight size={14} /><span>mini-SWE-agent</span></div>
        <div className="detail-hero-grid">
          <div>
            <div className="hand-label">{c.hero.kicker}</div>
            <h1><span>mini-SWE-agent</span><br />{c.hero.titleA}<br />{c.hero.titleB}<span className="highlight-green">{c.hero.highlight}</span></h1>
            <p className="hero-lead">{c.hero.lead}</p>
            <div className="hero-actions"><Link className="primary-link" to={{ pathname: solutionPath, hash: '#deploy' }}>{c.hero.primary} <ArrowRight size={18} /></Link><a className="text-link" href={SOURCE_URLS[0]} target="_blank" rel="noreferrer">{c.hero.repository} <ArrowUpRight size={16} /></a></div>
          </div>
          <aside className="verdict-note"><span className="tape" /><p className="note-kicker">{c.hero.noteKicker}</p><h2>{c.hero.verdictA}<br />{c.hero.verdictB}</h2><ul>{c.hero.bullets.map((bullet, index) => <li key={bullet}>{index === 3 ? <XCircle size={17} /> : <Check size={17} />}{bullet}</li>)}</ul><CopyPageLink copy={c.hero.copy} copied={c.hero.copied} /></aside>
        </div>
        <dl className="fact-ribbon">
          <div><dt>{c.facts.labels[0]}</dt><dd>v2.4.6 <small>{c.facts.notes[0]}</small></dd></div>
          <div><dt>{c.facts.labels[1]}</dt><dd>{c.facts.maintenanceValue} <small>{c.facts.notes[1]}</small></dd></div>
          <div><dt>{c.facts.labels[2]}</dt><dd>Python ≥ 3.10 <small>{c.facts.notes[2]}</small></dd></div>
          <div><dt>{c.facts.labels[3]}</dt><dd>MIT <small>{c.facts.notes[3]}</small></dd></div>
          <div><dt>{c.facts.labels[4]}</dt><dd>{VERIFY_DATE} <small>{c.facts.notes[4]}</small></dd></div>
        </dl>
      </header>

      <section className="page-width evidence-banner"><Info size={21} /><div><strong>{c.evidence.title}</strong><p>{c.evidence.body}</p></div><SourceLink href="https://github.com/SWE-agent/SWE-agent">{c.evidence.link}</SourceLink></section>

      <section className="page-width detail-section" id="architecture">
        <SectionHeading kicker={c.architecture.kicker} title={c.architecture.title} intro={c.architecture.intro} />
        <ArchitectureDiagram locale={locale} />
        <SourceStrip>{c.architecture.sources.map((label, index) => <SourceLink key={label} href={ARCHITECTURE_URLS[index]}>{label}</SourceLink>)}</SourceStrip>
      </section>

      <section className="tinted-section"><div className="page-width detail-section">
        <SectionHeading kicker={c.workflow.kicker} title={c.workflow.title} intro={c.workflow.intro} />
        <WorkflowDiagram locale={locale} />
        <div className="explanation-grid">{c.workflow.explanations.map(item => <div className="text-block" key={item.title}><h3>{item.title}</h3><p><Inline text={item.body} /></p></div>)}</div>
      </div></section>

      <section className="page-width detail-section" id="components">
        <SectionHeading kicker={c.components.kicker} title={c.components.title} intro={c.components.intro} />
        <RoleTable caption={c.components.caption} headers={c.components.headers} rows={c.components.rows} />
        <SourceStrip>{c.components.sources.map((label, index) => <SourceLink key={label} href={COMPONENT_URLS[index]}>{label}</SourceLink>)}</SourceStrip>
      </section>

      <section className="tinted-section blue-tint"><div className="page-width detail-section">
        <SectionHeading kicker={c.data.kicker} title={c.data.title} intro={c.data.intro} />
        <DataEventDiagram locale={locale} />
        <div className="code-with-note"><CodeBlock title={c.data.codeTitle} code={code.TRAJECTORY_CODE} language="bash" /><div className="sticky-explanation"><strong>{c.data.noteTitle}</strong><ul>{c.data.notes.map(note => <li key={note}><Inline text={note} /></li>)}</ul></div></div>
      </div></section>

      <section className="page-width detail-section" id="factory-fit">
        <SectionHeading kicker={c.factory.kicker} title={c.factory.title} intro={c.factory.intro} />
        <div className="factory-conveyor" aria-label={c.factory.aria}>{c.factory.steps.map((step, index) => {
          const Icon = factoryIcons[index]
          return <Fragment key={step.title}><div className={`conveyor-step ${index === 0 || index === 3 ? 'external' : 'internal'}`}><span>{index === 0 || index === 3 ? c.factory.outer : c.factory.internal}</span><Icon /><strong>{step.title}</strong><p>{step.lines.map((line, lineIndex) => <Fragment key={line}>{lineIndex > 0 && <> <ArrowRight className="inline-arrow" aria-hidden="true" /> </>}{line}</Fragment>)}</p></div>{index < 3 && <ArrowRight className="conveyor-arrow" />}</Fragment>
        })}</div>
        <div className="fit-grid"><div className="fit-column yes"><h3><CheckCircle2 />{c.factory.yesTitle}</h3><ul>{c.factory.yes.map(item => <li key={item}>{item}</li>)}</ul></div><div className="fit-column no"><h3><XCircle />{c.factory.noTitle}</h3><ul>{c.factory.no.map(item => <li key={item}>{item}</li>)}</ul></div></div>
      </section>

      <section className="tinted-section deploy-section" id="deploy"><div className="page-width detail-section">
        <SectionHeading kicker={c.deploy.kicker} title={c.deploy.title} intro={c.deploy.intro} />
        <div className="verification-stamp"><PackageCheck /><div><strong>{c.deploy.verificationTitle}</strong><p>{c.deploy.verification.start}<code>mini-swe-agent==2.4.6</code>{c.deploy.verification.between}<code>python -m minisweagent --help</code>{c.deploy.verification.after}<b>{c.deploy.verification.bold}</b></p></div><time>{VERIFY_DATE}</time></div>
        <div className="prereq-layout">
          <div className="prereq-list"><h3>{c.deploy.prereqTitle}</h3><dl>{c.deploy.prereqs.map(item => <div key={item.label}><dt>{item.label}</dt><dd><strong>{item.value}</strong><span>{item.note}</span></dd></div>)}</dl></div>
          <div className="directory-board"><h3>{c.deploy.directoryTitle}</h3><pre>{c.deploy.directoryTree}</pre><p><strong>{c.deploy.boundaryLead}</strong>{c.deploy.boundaryText}</p></div>
        </div>
        <CodeBlock title={c.deploy.installTitle} code={code.INSTALL_CODE} /><CodeBlock title={c.deploy.envTitle} code={code.ENV_CODE} />
        <DeploymentTabs locale={locale} />
        <SourceStrip label={c.deploy.commandSourceLabel}>{c.deploy.commandSources.map((label, index) => <SourceLink key={label} href={COMMAND_URLS[index]}>{label}</SourceLink>)}</SourceStrip>
      </div></section>

      <section className="tinted-section blue-tint" id="deploy-skill"><div className="page-width detail-section">
        <SectionHeading kicker={c.skill.kicker} title={c.skill.title} intro={c.skill.intro} /><DeploySkillCard skill={isEnglish ? miniSweAgentDeploySkillEn : miniSweAgentDeploySkill} />
      </div></section>

      <section className="page-width detail-section" id="automation">
        <SectionHeading kicker={c.automation.kicker} title={c.automation.title} intro={c.automation.intro} />
        <RoleTable caption={c.automation.caption} headers={c.automation.headers} rows={c.automation.rows} />
        <div className="automation-layout"><CodeBlock title={c.automation.codeTitle} code={code.AUTOMATION_CODE} /><div className="automation-notes"><h3>{c.automation.notesTitle}</h3><ol>{c.automation.notes.map((note, index) => <li key={note.title}><span>{index + 1}</span><p><strong>{note.title}</strong> {note.body}</p></li>)}</ol></div></div>
        <div className="config-warning"><AlertTriangle /><p><strong>{c.automation.warningLead}</strong><Inline text={c.automation.warningBody} /></p></div>
      </section>

      <section className="tinted-section"><div className="page-width detail-section">
        <SectionHeading kicker={c.acceptance.kicker} title={c.acceptance.title} intro={c.acceptance.intro} />
        <ol className="acceptance-grid">{c.acceptance.items.map((item, index) => <li key={item.title}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><p><Inline text={item.body} /></p></div></li>)}</ol>
        <DeploymentDiagram locale={locale} />
      </div></section>

      <section className="page-width detail-section" id="troubleshooting">
        <SectionHeading kicker={c.troubleshooting.kicker} title={c.troubleshooting.title} intro={c.troubleshooting.intro} />
        <div className="trouble-list">{c.troubleshooting.items.map((item, index) => <details key={item.title} open={index === 0 ? true : undefined}><summary><span>{String(index + 1).padStart(2, '0')}</span>{item.title}<ChevronRight /></summary><div><strong>{c.troubleshooting.causeLabel}</strong><p>{item.cause}</p><strong>{c.troubleshooting.actionLabel}</strong><p><Inline text={item.action} /></p><OptionalSource source={item.source} /></div></details>)}</div>
      </section>

      <section className="risk-section"><div className="page-width detail-section">
        <SectionHeading kicker={c.risk.kicker} title={c.risk.title} intro={c.risk.intro} />
        <div className="risk-grid">{c.risk.cards.map(card => <div className={`risk-card ${card.tone}`} key={card.title}><span>{card.level}</span><h3>{card.title}</h3><p>{card.body}</p><OptionalSource source={card.source} /></div>)}</div>
        <div className="lifecycle-grid"><div><h3><Clock3 />{c.risk.upgradeTitle}</h3><ol>{c.risk.upgrade.map(item => <li key={item}>{item}</li>)}</ol></div><div><h3><CircleDollarSign />{c.risk.backupTitle}</h3><ul>{c.risk.backup.map(item => <li key={item}>{item}</li>)}</ul></div></div>
      </div></section>

      <section className="page-width detail-section sources-section" id="sources">
        <SectionHeading kicker={c.sources.kicker} title={c.sources.title} intro={`${c.sources.introBefore}${VERIFY_DATE}${c.sources.introAfter}`} />
        <div className="source-list">{c.sources.items.map((item, index) => <a key={item.title} href={SOURCE_URLS[index]} target="_blank" rel="noreferrer"><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><p>{item.body}</p></div><ArrowUpRight /></a>)}</div>
        <div className="research-boundary"><AlertTriangle /><p><strong>{c.sources.boundaryLead}</strong>{c.sources.boundaryBody}</p></div>
      </section>

      <nav className="next-solution page-width" aria-label={c.nav.aria}><Link to={homePath}><ArrowLeft />{c.nav.back}</Link><Link to={`${isEnglish ? '/en' : ''}/solutions/openhands-agent-canvas`}><span>{c.nav.compare}<small>{c.nav.next}</small></span><ArrowRight /></Link></nav>
    </article>
  </PageShell>
}
