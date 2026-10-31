**Crime Diaries: product research brief — 29 October 2026**

The strongest positioning is **a verifiable case encyclopedia that teaches readers how evidence works**. Launch with carefully edited historical cases and forensics explainers; add community discussion and the Eye only when the editorial and moderation systems can support them.

This is product guidance, not legal advice. Before publishing sensitive material or opening community features, get advice from a media/privacy lawyer covering your launch markets.

**1. Landscape**

The limitations below are product assessments, not claims that these services fail their own missions.

| Product | What it does well; opening for Crime Diaries |
|---|---|
| [Murderpedia](https://murderpedia.org/) | Broad international offender reference; its offender-first organization leaves room for a case-first, evidence-focused experience. |
| [Wikipedia crime categories](https://en.wikipedia.org/wiki/Category:Crime) | Extensive linked coverage and revision histories; case structure and forensic detail vary across articles. |
| [Websleuths](https://websleuths.com/threads/websleuths-rules.321214/) | Dedicated discussion with explicit victim-friendly rules; long threads make established facts and subsequent corrections harder to retrieve. |
| [r/UnresolvedMysteries](https://www.reddit.com/r/UnresolvedMysteries/) / [r/TrueCrime](https://www.reddit.com/r/TrueCrime/) | Discovery, discussion and community knowledge; posts and comments do not form a consistently maintained encyclopedia. |
| [The Doe Network](https://www.doenetwork.org/) | Structured missing/unidentified-person records and credible potential-match submissions; its identification mission is narrower than a general crime reference. |
| [NamUs](https://namus.nij.ojp.gov/frequently-asked-questions) | Free US missing, unidentified and unclaimed-person databases plus professional support; neither worldwide nor a historical crime encyclopedia. |
| [The Charley Project](https://charleyproject.org/information/faq) | Consolidates missing-person information from numerous sources; explicitly does not investigate or accept investigative tips. |
| [Uncovered](https://uncovered.com/) | Cold-case discovery, community and case-update following; substantial overlap means crowdsourcing alone is not differentiation. |
| [Casefile](https://casefilepodcast.com/) and podcast/listening apps | Compelling narrative discovery and sustained attention; audio is less convenient for checking individual claims or comparing methods. |
| [Closure Intelligence](https://www.closure-intel.com/) | AI evidence ingestion and investigation support; an adjacent professional workflow, rather than a public educational encyclopedia. Vendor claims need independent evaluation. |

**2. What matters most, ranked**

1. **Claim-level sourcing.** Cite the specific judgment, document passage or reporting supporting each important statement. A source list at the bottom is insufficient.
2. **Accurate legal status and corrections.** Distinguish allegation, charge, conviction, acquittal, overturned conviction and unresolved outcome. Date every review.
3. **Protection of people.** Minimize identifying details, prevent harassment and make sensitive complaints easy to submit.
4. **Moderation capacity.** Open submissions can feed an editorial queue; publishing authority should initially remain restricted.
5. **Useful search.** Support aliases, dates, countries, outcomes and forensic methods before investing in conversational search.
6. **Scientific restraint.** Explain uncertainty and limitations. NIST’s [DNA-mixture explainer](https://www.nist.gov/feature-stories/dna-mixtures-forensic-science-explainer) illustrates why identifying DNA and explaining how it arrived are different questions.
7. **Readable, accessible presentation.** Keep the cinematic Eye optional, respect reduced-motion preferences and make articles usable without animation.

**3. The gap—and how to build it**

No credible research can establish that “no one has done” a feature anywhere. These are defensible opportunities in the combination.

- **A traceable record of each claim.** Clicking a timeline event opens its supporting passage, publication date and editorial status. Build `claims`, `sources`, `claim_sources` and versioned `events` tables in Supabase. Separate “police alleged” from “court found”; show source disagreements instead of silently resolving them.

- **Forensics connected to actual evidential roles.** Each method page explains what it measures, limitations, and cases where it generated a lead, supported identification, was challenged or contributed to exoneration. Use a case–method join table with evidence role and citations. Start with DNA profiling versus genetic genealogy; commission expert review before presenting scientific conclusions.

- **The Eye as a cited reference assistant.** Begin with structured filters and approved answer snippets. Later, retrieve only reviewed article passages and source metadata for Claude. Require sentence-level citations, validate citation IDs server-side and abstain when support is missing. Exclude theories from retrieval. Retrieval reduces hallucination risk; it cannot guarantee factual output.

- **Visible maintenance and useful contributions.** Offer “submit a source,” “flag an outdated outcome” and “explain this method,” with reviewed contributions recorded publicly. Add change-following for cases. This creates participation before you can safely support unrestricted theories.

Keep the Eye’s visual identity, but avoid giving it an omniscient investigator persona. Its promise should be: “Here is what this record supports.”

**4. What we must NOT do**

These combine legal requirements with deliberately stricter product policies.

- **Do not turn suspicion into guilt.** US defamation law varies by state; public figures generally face an actual-malice standard, while private people receive greater protection—see [*Gertz*](https://supreme.justia.com/cases/federal/us/418/323/). England and Wales require serious harm and recognize truth, honest-opinion and public-interest defenses under the [Defamation Act 2013](https://www.legislation.gov.uk/ukpga/2013/26/contents); other UK jurisdictions have distinct regimes. EU national laws vary, within a broader [European expression/reputation balance](https://www.echr.coe.int/documents/d/echr/fs_reputation_eng). **Build:** precise attributed language, legal-status fields, correction workflows and legal review before naming unconvicted suspects. A “Theories” label does not neutralize a defamatory accusation.

- **Do not exploit victims or families.** Public availability does not settle whether publication is appropriate. Use the [IPSO Editors’ Code](https://www.ipso.co.uk/editors-code-of-practice/) as an ethical benchmark, although it is not automatically binding on your site. **Build:** prohibit graphic autopsy/crime-scene imagery at launch; use neutral diagrams, sensitive-content notices and a family complaint channel. Ban users from organizing contact with families; founder outreach should be purposeful, consensual and easy to decline.

- **Do not prejudice active proceedings.** UK publication contempt can arise where material creates a substantial risk of serious prejudice to active proceedings, including online posts; proceedings can become active from arrest. See [Attorney General guidance](https://www.gov.uk/guidance/the-law-officers-approach-to-contempt-of-court-referrals). **Build:** jurisdiction and proceedings-status flags, reporting-restriction records, immediate discussion locks and reviewed factual updates only. Apply restrictions to the Eye too; do not assume a verdict ends every restriction.

- **Do not treat public criminal records as unrestricted data.** Correction: criminal-offence data is governed separately by **Article 10**, not Article 9’s “special categories”; allegations can qualify. The [GDPR](https://eur-lex.europa.eu/legal-content/En/ALL/?uri=CELEX%3A32016R0679) requires an Article 6 basis plus Article 10 authorization; UK requirements are explained by the [ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/criminal-offence-data/what-are-the-rules-on-criminal-offence-data/). Journalism exemptions are not automatic. **Build:** documented publication purposes, data minimization, access controls and a legal assessment before assembling a searchable conviction register. Get specialist advice on Article 10 and journalistic exemptions.

- **Do not ignore erasure requests or expose children.** Erasure rights have exceptions, including necessary expression and information uses; they require assessment, not blanket acceptance or refusal. See [ICO guidance](https://ico.org.uk/for-the-public/your-right-to-get-your-data-deleted/). Juvenile anonymity rules vary; [England/Wales youth-court restrictions](https://www.legislation.gov.uk/ukpga/Geo5/23-24/12/section/49) illustrate the risk. **Build:** private rights-request handling, retention limits and default anonymization of juvenile offenders. Check indirect identification through relatives, schools and locations.

- **Do not enable doxxing or vigilantism.** Reddit users’ 2013 misidentification of Sunil Tripathi as a Boston bombing suspect demonstrates the harm of crowd accusations. [Contemporary reporting](https://www.itv.com/news/update/2013-04-23/reddit-sorry-for-fuelling-boston-bombings-witch-hunt/). **Build:** prohibit private addresses, contact details, face-identification requests and mobilized harassment; premoderate accusations, rate-limit posting and route genuine tips to official channels. Never rank suspects by votes.

- **Do not copy material because it is online or in court.** Reused Wikipedia text requires applicable attribution and share-alike compliance; images have separate licenses. See [Wikimedia’s terms](https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use#7._Licensing_of_Content). News photographs require permission or a valid exception; fair use is contextual, not automatic. [Copyright Office guidance](https://www.copyright.gov/help/faq/faq-fairuse.html). Court access does not establish reuse rights for every exhibit or filing. **Build:** a rights ledger for every asset, original summaries and document-by-document rights checks.

- **Do not let AI invent allegations.** Models can fabricate facts and citations, as [NIST documents](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf). Liability depends on jurisdiction and facts; do not assume Section 230 shields generated output. **Build:** approved-corpus retrieval, refusal of suspect-generation requests, citation verification, factuality evaluations and an immediate disable switch.

- **Do not assume user posts remove platform responsibility.** [US Section 230](https://www.law.cornell.edu/uscode/text/47/230) generally protects against publisher liability for others’ content, with exceptions; it is not blanket immunity. In-scope UK services face [Online Safety Act duties](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/guide-for-services), potentially including overseas operators. The [EU DSA](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A32022R2065) imposes hosting notice-and-action duties; small-business exemptions are partial. **Build:** legal reporting, prompt triage, documented moderation decisions, complaints/appeals and applicable risk assessments before enabling community features.

**5. Recommended first steps**

1. **Choose launch jurisdictions and obtain focused legal advice** on publication, Article 10, anonymity and platform scope.
2. **Audit the 13 sample cases** for sourcing, legal status, rights and identifying details; replace weak entries.
3. **Write editorial and moderation policies**, including corrections, family requests and active-proceedings handling.
4. **Build the structured evidence model and conventional search**, then publish a small, reviewed case-and-forensics collection.
5. **Test usefulness with readers and a forensic reviewer**, measuring source-checking and retrieval tasks. Introduce the Eye after factuality testing; open theories only when moderation is staffed.