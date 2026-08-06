# Evidence base for app logic

Research review conducted August 2026. Every citation below was verified to
exist via literature search (author/year/journal, DOI where available).
This file maps each piece of app logic to its supporting evidence, and
records where evidence contradicted the app so future changes don't
silently regress.

---

## 1. RPE-based autoregulation (lib/progression.ts)

**App rule:** suggested weight = programme prescription; last comparable set
(±10% load, same reps, same heavy/deload lane) RPE ≤7 → increment, 8-9 →
hold, 10 → decrement.

- **Helms et al. 2018**, *Front Physiol* 9:247. RPE-based loading beat %1RM
  for squat 1RM (+17.1 vs +13.9 kg, ES 0.50) over 8 weeks, sets/reps matched.
- **Graham & Cleather 2021**, *JSCR* 35(9). RIR autoregulation > fixed
  loading for squat strength over 12 weeks.
- **Hickmott et al. 2022**, *Sports Med Open* 8:9. Meta: autoregulated vs
  standardized = +2.07 kg 1RM trend (p=0.09).
- **2025 network meta-analysis**, *J Exerc Sci Fit* (PMID 40791980): RPE,
  APRE and VBT all rank above percentage-based loading for 1RM.

**Verdict: core approach validated.** Autoregulating around a prescription
is better-supported than fixed percentage waves.

## 2. Increment size (lib/progression.ts `incrementFor`)

**App rule (updated Aug 2026):** increment ≈ 2.5% of working load, rounded
to 2.5 kg plate jumps, floored at 2.5 kg. Lifts under 25 kg get no load
increment (smallest jump >10%) — progress reps instead.

- **ACSM Position Stand 2009**, *MSSE* 41(3):687-708. Progress load 2-10%
  when reps exceed target on consecutive sessions.
- **Plotkin et al. 2022**, *PeerJ* (PMID 36199287). Load progression and rep
  (double) progression produce similar strength/hypertrophy — rep
  progression is a legitimate lane for lifts where plate jumps are too big.

**Previous rule (flat ±2.5 kg) contradicted this:** ~12% on a 20 kg lift,
~1.7% at 150 kg.

## 3. RPE reliability gates (lib/progression.ts `rpeReliableForIncrement`)

**App rule (updated Aug 2026):** RPE ≤7 on sets with target reps >10 does
not trigger a load increment.

- **Zourdos et al. 2016**, *JSCR* 30(1). RIR-based RPE scale validated;
  velocity-RPE r = −0.88 in experienced lifters.
- **Halperin et al. 2022**, *Sports Med* 52:377-390. Meta (n=414): lifters
  misjudge reps-to-failure by ~1 rep on average.
- **Hackett et al. 2017**, *JSCR* (PMID 27787474). Error ~1 rep when 0-5
  reps from failure, but >2 reps when far from failure; worse on high-rep
  sets. **Remmert et al. 2023** (*Percept Mot Skills*) confirms accuracy
  improves near failure.

## 4. Proximity to failure (why RPE 8-9 is the target zone)

- **Robinson et al. 2024**, *Sports Med* 54(9):2209-2231. Meta-regression:
  hypertrophy improves as sets approach failure; strength gains flat across
  a wide RIR range.
- **Refalo et al. 2023**, *Sports Med* 53(3). Training to absolute failure:
  trivial hypertrophy advantage (ES 0.19), unnecessary for strength.

**Verdict:** holding at RPE 8-9 and backing off from RPE 10 is correct —
there's no adaptation payoff for grinding at 10.

## 5. Epley 1RM scaling limits (lib/progression.ts)

**App rule (updated Aug 2026):** cross-rep Epley scaling only when both the
prior set and the target are ≤10 reps.

- **LeSuer et al. 1997**, *JSCR* 11(4). Seven prediction equations: r>0.95
  but ±3% accuracy only in the 2-10 rep range, degrading sharply beyond;
  all equations underestimate deadlift.
- Test-retest reliability of submaximal e1RM is high (ICC >0.96, *PLOS ONE*
  2023) — good enough for trend tracking within an exercise, but biased
  across exercises.

## 6. Rest intervals (components/session-log-form.tsx timer)

**App rule (updated Aug 2026):** 3 min after ≤5-rep sets; 2 min otherwise.

- **Schoenfeld et al. 2016**, *JSCR* 30(7):1805-1812. 3-min rest beat 1-min
  for both strength and hypertrophy in trained men.
- **Grgic et al. 2018**, *Sports Med* 48(1):137-151. ≥2 min favours
  strength; <1 min impairs it.

## 7. Concurrent training rules (lib/training-rules.ts)

**App rules (updated Aug 2026):** same-day warning only fires when the bike
session is actually hard (Z2 after lifting is fine, lifting-first is the
favourable order); new 24h rule for heavy lower-body → hard bike; weekly
intensity alert softened to info.

- **Wilson et al. 2012**, *JSCR* 26(8). Interference meta: running interferes
  more than cycling; interference scales with endurance frequency/duration.
- **Lundberg, Feuerbacher, Sünkeler & Schumann 2022**, *Sports Med*
  (DOI 10.1007/s40279-022-01688-x). Type I fibre interference with running
  (SMD −0.81) but **not cycling** — bike volume is low-threat to lifting.
- **Fyfe et al. 2014**, *Sports Med* 44:743-762. AMPK-mTOR interference
  window ~3h post-endurance — basis for the 6h separation heuristic.
- **Murlasits et al. 2018**, *J Sports Sci* 36(11). Strength-before-endurance
  order: +3.96 kg lower-body 1RM; VO2max unaffected by order.
- **Eddens et al. 2018**, *Sports Med* 48(1). Resistance-first ≈7% better
  lower-body strength outcomes.
- **Doma & Deakin 2017**, *Sports Med* 47(11). Residual fatigue from a heavy
  lower-body bout degrades endurance quality for 24-48h, resolving ~72h.
- **Rønnestad & Mujika 2014**, *Scand J Med Sci Sports* 24(4); **Vikmoen et
  al. 2016**; **Llanos-Lagos et al. 2025**, *Eur J Appl Physiol* 126(1)
  meta: heavy strength work improves cycling economy (ES 0.35), TT
  performance (ES 0.46), anaerobic power (ES 0.56); VO2max unchanged.
  Heavy load with maximal intended concentric velocity is the effective
  protocol (light-load "explosive" work did not transfer).
- **Rønnestad, Hansen & Raastad 2010**, *Eur J Appl Physiol* 110(6): one
  heavy session/week maintains strength gains through a 13-week race block.

## 8. Intensity distribution (lib/training-rules.ts weekly alert)

- **Seiler & Kjerland 2006**, *Scand J Med Sci Sports* 16(1); **Seiler
  2010**, *IJSPP* 5(3). The ~80/20 description of elite training. The "2-3
  hard sessions/week" figure is observational, not a validated ceiling.
- **Stöggl & Sperlich 2014**, *Front Physiol* 5:33. Polarised beat threshold
  training in a 9-week RCT of trained athletes.
- **Rosenblat et al. 2025**, *Sports Med* 55(3):655-673 (network meta of
  IPD, 13 studies): **no overall difference polarised vs pyramidal;
  recreational athletes actually did better with pyramidal.** Strict 80/20
  enforcement for amateurs is not evidence-based.

## 9. Deloads (programme structure)

- **Bell et al. 2023**, *Sports Med Open* 9:87 (Delphi): expert consensus is
  1-week deloads roughly every 4-8 weeks, volume-led reductions — consensus,
  not trial evidence.
- **Coleman et al. 2024**, *PeerJ* 12:e16777 (RCT): mid-cycle deload gave
  equal hypertrophy, slightly *less* strength than continuous training.

**Verdict:** fixed-calendar deloads are practice, not proof. Reactive
(fatigue-triggered) deloads are the defensible version — the app's W2
deload was pulled forward for carried-in fatigue, which fits. Long-term:
trigger deloads from performance/RPE trends rather than fixed weeks.

## 10. Taper (programme structure — open item)

- **Bosquet et al. 2007**, *MSSE* 39(8) meta: optimal taper = ~2 weeks,
  volume cut 41-60% exponentially, **intensity and frequency maintained**.
- **Wang et al. 2023**, *PLoS ONE* 18(5) confirms.

**Flag:** the 10-week plan tapers for ~1 week (W10). Evidence favours
starting the ramp-down ~10-14 days out while keeping some intensity.
W9's dress rehearsal partially serves this, but W9 also stacks 4 strength
tests — consider trimming if fatigued.

## 11. Long-ride progression (Sat rides)

- The "10% weekly rule" is unvalidated — **Buist et al. 2008**, *Am J Sports
  Med* 36(1): a graded 10% programme did not reduce injuries vs standard.
- Risk concentrates in large jumps in the *single longest session* vs
  recent history, not weekly totals.

## 12. Load monitoring (future work)

- **Foster 1998**, *MSSE* 30(7). sRPE load = session RPE × minutes;
  monotony (mean/SD daily load) and strain (load × monotony) predicted
  illness spikes. **Haddad et al. 2017** (*Front Neurosci*): sRPE valid and
  reliable, but thresholds are individual — compare to own baseline.
- **ACWR: do not implement.** Impellizzeri et al. 2020 (*IJSPP* 15(6)):
  statistically unstable, causally unestablished. A simple week-on-week
  load-change flag is more honest.
- **Maunder et al. 2021** (*Sports Med*): durability/aerobic decoupling (HR
  drift at fixed power) is a sound fitness signal — natural extension of
  the existing HR-at-28-30km/h tracking.
- **Iversen et al. 2021** (*Sports Med* 51); **Spiering et al. 2021**
  (*JSCR* 35(5)): strength is maintainable on ~1 session/week if load is
  preserved — basis for a future race-block "maintenance mode".

## 13. Strength/hypertrophy rotation frequency (programme structure)

**User goal:** train both strength and hypertrophy, alternating focus.

- **Rhea et al. 2002**, *JSCR* 16(2). DUP beat linear for 1RM over 12
  weeks (small, short study).
- **Harries et al. 2015**, *JSCR* 29(4) meta (17 studies, n=510): no
  significant difference linear vs undulating for strength.
- **Grgic et al. 2017**, *PeerJ* 5:e3695 meta: linear vs DUP —
  **hypertrophy identical**.
- **Moesgaard et al. 2022**, *Sports Med* 52(7):1647-1666 (volume-equated
  meta): undulating > linear for 1RM (ES 0.31), driven by **trained
  lifters (ES 0.61)**; hypertrophy unaffected (ES 0.05).
- **Painter et al. 2012**, *IJSPP* 7(2): block vs DUP in trained track
  athletes — equal strength gains with **~35% less volume-load** for
  block (efficiency matters when concurrent endurance load is high).
- **Rønnestad et al. 2014** (*Scand J Med Sci Sports*) and **2019**
  (DOI 10.1111/sms.13326): block-organised training beat evenly-mixed
  distribution in cyclists and in concurrent strength+endurance athletes.
- **No trial establishes an optimal block length** — the customary 3-6
  week mesocycle is convention, not evidence. Note: a "Caldas et al."
  periodization meta could not be verified; do not cite it.

**Verdict:** rotation frequency barely matters for hypertrophy; undulation
modestly favours strength in trained lifters; blocks are more *efficient*
per unit volume (valuable alongside cycling). App recommendation: weekly
undulation inside the current programme; post-goal-ride, 4-6 week
hypertrophy blocks alternating with 3-4 week strength blocks, keeping one
heavy day in hypertrophy blocks and one volume day in strength blocks.
