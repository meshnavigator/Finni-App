# Sprint 7–10 — layered 2D delivery gate

```mermaid
flowchart LR
    Decision[DEC-006 Accepted<br/>2D cutout / 2.5D] --> Art[S7-004 PASS<br/>art + provenance]
    Decision --> Spike[S7-005 PASS<br/>runtime + signed release spike]
    Spike --> Tech{DEC-007<br/>Accepted}
    Art --> Cleanup[S7-006 PASS<br/>3D retired + clean release]
    Tech --> Cleanup
    Cleanup --> S8[Sprint 8<br/>accepted assets + engineering slice]
    S8 --> S9[Sprint 9<br/>implementation complete]
    S8 -. remaining device gates .-> S10A
    S8 -. remaining art gates .-> S10B
    S9 --> S10A[S10-001<br/>physical device/accessibility/performance]
    S10A --> S10B[S10-002<br/>visual + functional acceptance]
    S10B --> Final[Sprint 9 final external verdict]
    Device[S0-006<br/>physical API 26] -. device evidence .-> S10A
```

The 2D presentation branch remains downstream of persisted command results.
Sprint 10 starts from Sprint 9 implementation readiness; Sprint 9's final external
verdict follows Sprint 10 acceptance. Partial S9-001/003/004 reports retain the
unrun physical, TalkBack, performance and independent review criteria.
R1–R4, the 3D addendum and partial reports are retained as historical evidence;
they are not production dependencies after S7-006.
