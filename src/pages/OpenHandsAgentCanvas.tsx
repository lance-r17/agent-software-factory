import { Fragment, useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, ExternalLink, History, PackageCheck, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { CodeBlock, SectionHeading, SourceLink, SourceStrip, copyText } from '../components/CodeBlock'
import { DeploySkillCard } from '../components/DeploySkill'
import { PageShell } from '../components/Layout'
import { RouteTabs } from '../components/RouteTabs'
import { CanvasArchitectureDiagram, DeployRoutesDiagram, EventLoopDiagram, FactoryPipelineDiagram, FactoryRolesDiagram, StateOwnershipDiagram } from '../components/OpenHandsDiagrams'
import { openHandsDeploySkill } from '../data/deploySkills'
import { openHandsDeploySkillEn } from '../data/deploySkillsEn'
import { openHandsContent } from '../data/solutionContent/openHandsContent'
import { openHandsCode } from '../data/solutionContent/openHandsCode'
import type { Locale } from '../locale'

const VERIFY_DATE = '2026-11-21'
const PREVIOUS_DATE = '2026-11-20'
const SOURCE_URLS = [
  'https://github.com/OpenHands/OpenHands', 'https://github.com/OpenHands/OpenHands/releases/tag/v1.43.0',
  'https://docs.openhands.dev/overview/introduction', 'https://docs.openhands.dev/openhands/usage/agent-canvas/architecture',
  'https://docs.openhands.dev/openhands/usage/use-cases/software-factory', 'https://docs.openhands.dev/openhands/usage/agent-canvas/setup',
  'https://docs.openhands.dev/openhands/usage/agent-canvas/backend-setup/docker-execution', 'https://github.com/OpenHands/OpenHands/blob/main/docs/SELF_HOSTING.md',
  'https://docs.openhands.dev/openhands/usage/agent-canvas/troubleshooting',
]
const ARCHITECTURE_URLS = [SOURCE_URLS[3], SOURCE_URLS[0], 'https://github.com/OpenHands/software-agent-sdk']
const COMPONENT_URLS = [SOURCE_URLS[2], 'https://docs.openhands.dev/sdk/index', 'https://github.com/OpenHands/automation']
const FACTORY_URLS = [SOURCE_URLS[4], 'https://docs.openhands.dev/openhands/usage/agent-canvas/acp-agents', 'https://docs.openhands.dev/openhands/usage/agent-canvas/agent-profiles']
const COMMAND_URLS = [SOURCE_URLS[5], SOURCE_URLS[7], SOURCE_URLS[6]]
const TROUBLE_URLS = [SOURCE_URLS[8], 'https://docs.openhands.dev/openhands/usage/llms/local-llms']

type Row = { chip: string; tone: string; input: string; role: string; boundary: string }
type LinkContent = { href: string; label: string }

function Inline({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[\[arrow\]\])/g).map((part, index) => part.startsWith('`') && part.endsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : part.startsWith('**') && part.endsWith('**') ? <b key={index}>{part.slice(2, -2)}</b> : part === '[[arrow]]' ? <ArrowRight key={index} className="inline-arrow" aria-hidden="true" /> : <Fragment key={index}>{part}</Fragment>)}</>
}
function RoleTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: Row[] }) {
  return <div className="component-table-wrap"><table className="component-table"><caption className="sr-only">{caption}</caption><thead><tr>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.chip}><th><span className={`component-chip ${row.tone}`}>{row.chip}</span></th><td>{row.input}</td><td>{row.role}</td><td>{row.boundary}</td></tr>)}</tbody></table></div>
}
function CopyPageLink({ copy, copied }: { copy: string; copied: string }) {
  const [wasCopied, setWasCopied] = useState(false)
  return <button type="button" className="copy-page-link" onClick={async () => { try { await copyText(window.location.href); setWasCopied(true); window.setTimeout(() => setWasCopied(false), 1600) } catch { setWasCopied(false) } }}>{wasCopied ? <Check size={16} /> : <ExternalLink size={16} />}{wasCopied ? copied : copy}</button>
}
function OptionalSource({ source }: { source?: LinkContent }) { return source ? <SourceLink href={source.href}>{source.label}</SourceLink> : null }
function DeploymentTabs({ locale }: { locale: Locale }) {
  const c = openHandsContent[locale].deploy, code = openHandsCode[locale]
  const tabs = c.tabs.map(tab => ({ ...tab, env: code[tab.envCode as keyof typeof code], run: tab.runCode ? code[tab.runCode as keyof typeof code] : tab.runText }))
  return <RouteTabs tabs={tabs} initialId="npm" ariaLabel={c.tabsAria}>{current => <><h3>{current.title}</h3><p>{current.note}</p><CodeBlock title={locale === 'en' ? `${current.id} route commands` : `${current.id} 路线命令`} code={current.env} /><CodeBlock title={locale === 'en' ? 'Verification and follow-up' : '验证与后续操作'} code={current.run} /></>}</RouteTabs>
}

export default function OpenHandsAgentCanvas({ locale }: { locale: Locale }) {
  const c = openHandsContent[locale], code = openHandsCode[locale], isEnglish = locale === 'en'
  const homePath = isEnglish ? '/en' : '/'
  const solutionPath = `${isEnglish ? '/en' : ''}/solutions/openhands-agent-canvas`
  return <PageShell><article className="detail-page openhands-page">
    <header className="detail-hero page-width">
      <div className="breadcrumb"><Link to={homePath}><ArrowLeft size={16} /> {c.hero.breadcrumb}</Link><ChevronRight size={14} /><span>OpenHands Agent Canvas</span></div>
      <div className="detail-hero-grid"><div>
        <div className="hand-label">{c.hero.kicker}</div><h1><span>OpenHands</span><br />{c.hero.titleA}<br />{c.hero.titleB}<span className="highlight-pink">{c.hero.highlight}</span></h1><p className="hero-lead">{c.hero.lead}</p>
        <div className="hero-actions"><Link className="primary-link" to={{ pathname: solutionPath, hash: '#deploy' }}>{c.hero.primary} <ArrowRight size={18} /></Link><a className="text-link" href={SOURCE_URLS[0]} target="_blank" rel="noreferrer">{c.hero.repository} <ArrowUpRight size={16} /></a></div>
      </div><aside className="verdict-note"><span className="tape" /><p className="note-kicker">{c.hero.noteKicker}</p><h2>{c.hero.verdictA}<br />{c.hero.verdictB}</h2><ul>{c.hero.bullets.map((bullet,index)=><li key={bullet}>{index===3?<XCircle size={17}/>:<Check size={17}/>}{bullet}</li>)}</ul><CopyPageLink copy={c.hero.copy} copied={c.hero.copied} /></aside></div>
      <dl className="fact-ribbon"><div><dt>{c.facts.labels[0]}</dt><dd>v1.43.0 <small>{c.facts.notes[0]}</small></dd></div><div><dt>{c.facts.labels[1]}</dt><dd>{c.facts.maintenanceValue} <small>{c.facts.notes[1]}</small></dd></div><div><dt>{c.facts.labels[2]}</dt><dd>Node ≥ 24 + uv <small>{c.facts.notes[2]}</small></dd></div><div><dt>{c.facts.labels[3]}</dt><dd>{c.facts.licenseValue} <small>{c.facts.notes[3]}</small></dd></div><div><dt>{c.facts.labels[4]}</dt><dd>{VERIFY_DATE} <small>{c.facts.notes[4]}</small></dd></div></dl>
    </header>

    <section className="page-width evidence-banner"><History size={21} /><div><strong>{c.evidence.title}</strong><p>{c.evidence.bodyBefore}{PREVIOUS_DATE}{c.evidence.bodyAfter}</p></div><SourceLink href={SOURCE_URLS[2]}>{c.evidence.link}</SourceLink></section>

    <section className="page-width detail-section" id="architecture"><SectionHeading kicker={c.architecture.kicker} title={c.architecture.title} intro={c.architecture.intro} /><CanvasArchitectureDiagram locale={locale} /><SourceStrip>{c.architecture.sources.map((label,index)=><SourceLink key={label} href={ARCHITECTURE_URLS[index]}>{label}</SourceLink>)}</SourceStrip></section>

    <section className="tinted-section"><div className="page-width detail-section"><SectionHeading kicker={c.workflow.kicker} title={c.workflow.title} intro={c.workflow.intro} /><EventLoopDiagram locale={locale} /><div className="explanation-grid">{c.workflow.explanations.map(item=><div className="text-block" key={item.title}><h3>{item.title}</h3><p>{item.body}</p></div>)}</div></div></section>

    <section className="page-width detail-section" id="components"><SectionHeading kicker={c.components.kicker} title={c.components.title} intro={c.components.intro} /><RoleTable caption={c.components.caption} headers={c.components.headers} rows={c.components.rows} /><SourceStrip>{c.components.sources.map((label,index)=><SourceLink key={label} href={COMPONENT_URLS[index]}>{label}</SourceLink>)}</SourceStrip></section>

    <section className="tinted-section blue-tint"><div className="page-width detail-section"><SectionHeading kicker={c.data.kicker} title={c.data.title} intro={c.data.intro} /><StateOwnershipDiagram locale={locale} /><div className="code-with-note"><CodeBlock title={c.data.codeTitle} code={code.UPDATE_BACKUP} /><div className="sticky-explanation"><strong>{c.data.noteTitle}</strong><ul>{c.data.notes.map(note=><li key={note}><Inline text={note} /></li>)}</ul></div></div></div></section>

    <section className="page-width detail-section" id="factory-fit"><SectionHeading kicker={c.factory.kicker} title={c.factory.title} intro={c.factory.intro} /><FactoryPipelineDiagram locale={locale} /><FactoryRolesDiagram locale={locale} /><div className="fit-grid"><div className="fit-column yes"><h3><CheckCircle2 />{c.factory.yesTitle}</h3><ul>{c.factory.yes.map(item=><li key={item}>{item}</li>)}</ul></div><div className="fit-column no"><h3><XCircle />{c.factory.noTitle}</h3><ul>{c.factory.no.map(item=><li key={item}>{item}</li>)}</ul></div></div><SourceStrip>{c.factory.sources.map((label,index)=><SourceLink key={label} href={FACTORY_URLS[index]}>{label}</SourceLink>)}</SourceStrip></section>

    <section className="tinted-section deploy-section" id="deploy"><div className="page-width detail-section"><SectionHeading kicker={c.deploy.kicker} title={c.deploy.title} intro={c.deploy.intro} /><div className="verification-stamp"><PackageCheck /><div><strong>{c.deploy.verificationTitle}</strong><p><Inline text={c.deploy.verification} /></p></div><time>{VERIFY_DATE}</time></div>
      <div className="prereq-layout"><div className="prereq-list"><h3>{c.deploy.prereqTitle}</h3><dl>{c.deploy.prereqs.map(item=><div key={item.label}><dt>{item.label}</dt><dd><strong>{item.value}</strong><span>{item.note}</span></dd></div>)}</dl></div><div className="directory-board"><h3>{c.deploy.directoryTitle}</h3><pre>{c.deploy.directoryTree}</pre><p><strong>{c.deploy.secretLead}</strong>{c.deploy.secretBeforeArrow}<ArrowRight className="inline-arrow" aria-hidden="true" />{c.deploy.secretAfterArrow}</p></div></div>
      <DeploymentTabs locale={locale} /><div className="config-warning"><AlertTriangle /><p><strong>{c.deploy.warningLead}</strong><Inline text={c.deploy.warningBody} /></p></div><SourceStrip label={c.deploy.commandSourceLabel}>{c.deploy.commandSources.map((label,index)=><SourceLink key={label} href={COMMAND_URLS[index]}>{label}</SourceLink>)}</SourceStrip>
    </div></section>

    <section className="tinted-section blue-tint" id="deploy-skill"><div className="page-width detail-section"><SectionHeading kicker={c.skill.kicker} title={c.skill.title} intro={c.skill.intro} /><DeploySkillCard skill={isEnglish?openHandsDeploySkillEn:openHandsDeploySkill} /></div></section>

    <section className="page-width detail-section" id="automation"><SectionHeading kicker={c.automation.kicker} title={c.automation.title} intro={c.automation.intro} /><RoleTable caption={c.automation.caption} headers={c.automation.headers} rows={c.automation.rows} /><div className="automation-layout"><CodeBlock title={c.automation.codeTitle} language="text" code={c.automation.setupCode} /><div className="automation-notes"><h3>{c.automation.notesTitle}</h3><ol>{c.automation.notes.map((note,index)=><li key={note.title}><span>{index+1}</span><p><strong>{note.title}</strong>{note.body}</p></li>)}</ol></div></div></section>

    <section className="tinted-section"><div className="page-width detail-section"><SectionHeading kicker={c.acceptance.kicker} title={c.acceptance.title} intro={c.acceptance.intro} /><ol className="acceptance-grid">{c.acceptance.items.map((item,index)=><li key={item.title}><span>{String(index+1).padStart(2,'0')}</span><div><strong>{item.title}</strong><p><Inline text={item.body} /></p></div></li>)}</ol><DeployRoutesDiagram locale={locale} /></div></section>

    <section className="page-width detail-section" id="troubleshooting"><SectionHeading kicker={c.troubleshooting.kicker} title={c.troubleshooting.title} intro={c.troubleshooting.intro} /><div className="trouble-list">{c.troubleshooting.items.map((item,index)=><details key={item.title} open={index===0?true:undefined}><summary><span>{String(index+1).padStart(2,'0')}</span>{item.title}<ChevronRight /></summary><div><strong>{c.troubleshooting.causeLabel}</strong><p>{item.cause}</p><strong>{c.troubleshooting.actionLabel}</strong><p><Inline text={item.action} /></p></div></details>)}</div><SourceStrip>{c.troubleshooting.sources.map((label,index)=><SourceLink key={label} href={TROUBLE_URLS[index]}>{label}</SourceLink>)}</SourceStrip></section>

    <section className="risk-section"><div className="page-width detail-section"><SectionHeading kicker={c.risk.kicker} title={c.risk.title} intro={c.risk.intro} /><div className="risk-grid">{c.risk.cards.map(card=><div className={`risk-card ${card.tone}`} key={card.title}><span>{card.level}</span><h3>{card.title}</h3><p>{card.body}</p><OptionalSource source={card.source} /></div>)}</div><div className="lifecycle-grid"><div><h3><Clock3 />{c.risk.upgradeTitle}</h3><ol>{c.risk.upgrade.map(item=><li key={item}>{item}</li>)}</ol></div><div><h3><CircleDollarSign />{c.risk.backupTitle}</h3><ul>{c.risk.backup.map(item=><li key={item}>{item}</li>)}</ul></div></div></div></section>

    <section className="page-width detail-section sources-section" id="sources"><SectionHeading kicker={c.sources.kicker} title={c.sources.title} intro={`${c.sources.introBefore}${VERIFY_DATE}${c.sources.introMiddle}${PREVIOUS_DATE}${c.sources.introAfter}`} /><div className="source-list">{c.sources.items.map((item,index)=><a key={item.title} href={SOURCE_URLS[index]} target="_blank" rel="noreferrer"><span>{String(index+1).padStart(2,'0')}</span><div><strong>{item.title}</strong><p>{item.body}</p></div><ArrowUpRight /></a>)}</div><div className="research-boundary"><AlertTriangle /><p><strong>{c.sources.boundaryLead}</strong>{c.sources.boundaryBody}</p></div></section>

    <nav className="next-solution page-width" aria-label={c.nav.aria}><Link to={homePath}><ArrowLeft />{c.nav.back}</Link><Link to={`${isEnglish?'/en':''}/solutions/mini-swe-agent`}><span>{c.nav.compare}<small>{c.nav.next}</small></span><ArrowRight /></Link></nav>
  </article></PageShell>
}
