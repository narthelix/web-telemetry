# AGENTS.md

Instructions for any AI agent working in this repository. Claude Code reads
`CLAUDE.md`; every other tool — Copilot, Cursor, Codex — reads this file.

**It deliberately copies no rules.** Two copies of a rule are two things to
correct, and the day they disagree nothing errors. Everything below is a
pointer to where the rule actually lives.

## Read these first, in this order

1. **`CLAUDE.md` in this repo** (if present). The name says Claude; the content
   is tool-agnostic. Treat it as addressed to you.
2. **`CONVENTIONS.md` in `narthelix/handbook`** — the org's working rules. Its
   own first line: *"a human, Claude Code, or any other agent reading this file
   sees the same rules."*
3. **`specs/technical/build_state.md` in `narthelix/muznara`** — the ledger:
   where the work actually stands. Read it before choosing what to do next. If
   it and anything else disagree, the ledger wins.
4. **`ways-of-working/agent_memory.md` in `narthelix/handbook`** — the distilled
   facts carried between sessions (`narthelix/agent-memory`): where that
   directory actually is, how to read the index, and how to write a fact back.
   Read it before your first session on a machine.

Those last three are **other repositories** (or, for the memory, a clone outside
the workspace entirely). `narthelix/workspace` clones every org repo side by
side, so from inside one of them they are `../handbook/` and `../muznara/`.
Opening a single repo as your editor's folder puts them outside it — read them
from the terminal, or open the workspace directory instead so that one session
sees all of them.

Two things `agent_memory.md` will tell you that otherwise cost time to learn: the
memory directory's path is **configured, never derived** — computing it from the
working directory is wrong on some machines — and `MEMORY.md` is an *index*, so a
one-line hook is never the fact itself.

## Handing work back

Sessions here alternate between tools. What carries across is not chat history —
it is the ledger, the memory, and git. So, as you go rather than at the end:

- **Update `build_state.md`** when something lands. An agent picking up next
  week reads it, not your transcript.
- **Push memory facts**, per `agent_memory.md`. Memory written only locally is
  memory one machine has.
- **One PR per unit of work**, so the history is legible without you.

## Two gates that fail while looking correct

- **Branch names are regex-gated** (Convention #15): `<type>/<issue-no>-<kebab>`, type one of
  `feature|fix|chore|docs|refactor`. An uppercase letter, `_`, `.`, a double or
  trailing hyphen, or a Turkish diacritic (ş/ğ/ı/ö/ü/ç) fails the required
  check while reading correctly. `mani run install-hooks` in the workspace
  rejects a bad name before the push instead of after the red PR.
- **Issues for every repo live in `narthelix/muznara`**, not the repo you are
  in. The issue number rides in the **branch name**; a bare `#N` in the PR body
  would resolve against the wrong tracker, so most repos do not require one.
