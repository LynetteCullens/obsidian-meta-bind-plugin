---
progress1: -6
progress2: 0.7
progress3: 2
progress4: 2.6
---

```meta-bind
INPUT[progressBar(showcase, minValue(-10), maxValue(3)):progress1]
```

```meta-bind
INPUT[progressBar(showcase, minValue(0), maxValue(1), stepSize(0.1)):progress2]
```

```meta-bind
INPUT[progressBar(showcase, minValue(0), maxValue(10), stepSize(-1)):progress3]
```

```meta-bind
INPUT[progressBar(showcase, minValue(0), maxValue(10), stepSize(0.1)):progress4]
```

```meta-bind
INPUT[progressBar(defaultValue(53), class(red))]
```

```meta-bind-js-view
{progress1} as progress1
{progress4} as progress4
---
const progress1 = context.bound.progress1;
const progress4 = context.bound.progress4;
const progress = `\`\`\`meta-bind
INPUT[progressBar(defaultValue(1), minValue(${progress1}), maxValue(${progress4}), class(red))]
\`\`\``;

return engine.markdown.create(progress);
```
