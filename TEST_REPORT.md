# CaptionBridge — Test Report

**Date:** 2026-10-15 02:33
**Server:** http://localhost:3000

## Functional Tests

| Feature | Status | Time | Result |
|---------|--------|------|--------|
| F1 Comparison | ✅ | 3.4s | 3 |
| F2 Analogy | ✅ | 2.8s | 2 |
| F4 Equations | ✅ | 3.7s | 3 |
| F6 System | ✅ | 2.7s | 1 |
| F7 Visualize | ✅ | 3.4s | ✓ |
| F8 Causal | ✅ | 4.7s | 0 |
| F9 Argument | ❌ | 6.6s | 3 |
| Flow Diagram | ✅ | 3.1s | ✓ |


## Load Tests

| Level | Success | Failed | Avg (s) | Min | Max | Total (s) | RPS |
|-------|---------|--------|---------|-----|-----|-----------|-----|
| 5 | 2 | 3 | 1.6 | 0 | 4.5 | 8.1 | 0.62 |
| 10 | 0 | 10 | 0 | 0 | 0 | 0.2 | 50 |
| 20 | 0 | 20 | 0 | 0 | 0.1 | 0.4 | 50 |
| 30 | 0 | 30 | 0 | 0 | 0 | 0.4 | 75 |


## Max Users Estimate

- **Highest successful load (90%+):** 0 requests
- **Estimated concurrent users:** ~3-5 يوزر يومي
- **Bottleneck:** Hakim STT limits
- **Vercel constraint:** Hobby plan

## Notes

- All 10 features implemented
- Error handling system deployed
- Multi-key rotation active
