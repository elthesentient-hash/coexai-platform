---
name: recursive-self-improvement
description: Document learnings, mistakes, and improvements to continuously refine workflows. Use after completing tasks to capture what worked, what didn't, and how to improve next time. Inspired by the concept of AI systems that improve themselves through iteration.
---

# Recursive Self-Improvement

Continuously improve by documenting learnings from every task.

## Philosophy

Every task is a learning opportunity. Document what you learn and apply it to future work.

> "This is recursive self-improvement." — From podcast analysis

## Workflow

### 1. After Completing Any Task

Ask yourself:
- What obstacle did I encounter?
- How did I solve it?
- What would I do differently next time?
- What pattern emerged?

### 2. Document in Memory

Write to `memory/YYYY-MM-DD.md`:
```markdown
## Lessons Learned

**From [Task]:** "[Key insight]"
- [Specific obstacle] → [Solution]
- **Takeaway:** [General principle]
```

### 3. Apply Going Forward

Before starting similar tasks, check memory files for relevant lessons.

## Example from Experience

**YouTube Video Processing:**
- ❌ YouTube bot detection blocked us
- ✅ Found `--force-ipv4` workaround
- **Takeaway:** When services block datacenter IPs, try IPv4 forcing or proxy options

**Video Clipping:**
- ❌ First clips had no audio (used `-an` flag)
- ✅ Re-cut with audio preserved
- **Takeaway:** Don't use `-an` unless specifically requested

**Lesson from Elijah:**
- 💬 "Consistently persevere no matter what"
- **Applied:** Kept trying different approaches until YouTube downloading worked

## Patterns to Watch For

### Technical Patterns
- API limits → Caching strategies
- Rate limiting → Exponential backoff
- File format issues → Validation pipelines

### Workflow Patterns  
- Repeated code → Script it
- Repeated questions → Create templates
- Repeated research → Build references

### Communication Patterns
- User frustration → Clarify limitations honestly
- User praise → Document what worked
- User requests → Capture requirements precisely

## Implementation

### Daily Memory Files
- `memory/YYYY-MM-DD.md` — Raw daily logs
- Document decisions, obstacles, solutions

### Curated Memory
- `MEMORY.md` — Long-term distilled wisdom
- Review periodically and update

### Skill Improvements
When a pattern emerges 3+ times, consider creating/updating a skill.

## Quote from Analysis

> "I think this is as important as Bitcoin where the internet or the mobile revolution. I think the open claw agent revolution is here."

**Applied:** Take revolutionary ideas seriously. Document them.
