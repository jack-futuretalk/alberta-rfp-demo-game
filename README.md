# Advertisement Claim Checker

Bare-bones demo of the Alberta RFP Advertisement Claim Checker activity: a front-of-class vote where students judge food and wellness ads with three options, **backed by evidence**, **not backed by evidence**, or **no actual claim made** (the soft-sell trap).

Pairs with the microsite lesson *Food Literacy Through Advertising Analysis* (draft PDF in `docs/`).

## Themes (client demo)

Use the **Look** control in the header, or open with a query param:

- [Instagram](?theme=instagram)
- [TikTok](?theme=tiktok)
- [Skeuomorphic](?theme=skeuo)

The choice is remembered in `localStorage` for the next visit.

## Run locally

Serve the folder over HTTP (fetch needs it for the JSON data files):

```bash
npx --yes serve .
```

Then open the URL shown in the terminal (usually http://localhost:3000).

## What's in this build

- Front-of-class vote flow: teacher clicks the majority answer
- Wrong votes are marked and ruled out; the ad stays up until the class gets it right
- Reveal only after a correct vote: feeling sold, literal claim, credible-source read, technique, where to verify
- 8 draft rounds aligned to soft-sell techniques + brand voice vs credible nutrition sources
- Draft microsite knowledge checks in `data/knowledge-checks.en.json` (not wired into the game UI yet)
- UI strings and round content externalized in `data/` for later French drop-in

## Alberta PEW 8 alignment

Advertisement Claim Checker maps to the Food Literacy organizing idea (*How can food literacy support nutrition and well-being?*) and these skills & procedures:

| Skill / knowledge | In the game |
|---|---|
| Identify credible sources (RDs; government / public health) | Reveal + verify copy; brand marketing ruled out as neutral source |
| Explore nutrition for growth & development | TrailSide yogurt round (calcium + vitamin D / bone growth in adolescence) |
| Consider social media & advertising in food choice | Three-button mechanic; youth-targeted soft sell; diet-trend misinformation |
| Health claims on packaging / misinformation | Sunrise cereal; PurePath detox |
| Nutrition Facts (serving size, sugar, etc.) | Called out on reveals when checking claims |

Intentionally out of scope for this activity (covered elsewhere in the outcome): food safety, additives, culture, processed vs whole foods, cost/convenience trade-offs.

Curriculum note: `docs/AlbertaEducation.txt` (LearnAlberta PDE8 Food Literacy excerpt).


## Not in this build yet

- Final MediaSmarts fact-checked ads (current rounds are marked DRAFT)
- Technique identification as a second scored step
- SCORM 1.2 packaging
- Teacher facilitation one-pager
- Visual system from Suz / real ad art
- Wired knowledge-check UI (data only for now)

## Source docs

References in `docs/`: creative brief, MediaSmarts source lesson, and the draft microsite PDF.
