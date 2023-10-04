---
playerCount: 6
playerLevel: 4
enemy:
  - name: Someting
    level: 4
    count: 1
    variant: 0
  - name: Some other thing
    level: 2
    count: 1
    variant: 0
  - name: dragon
    level: 2
    count: 2
    variant: -1
  - name: test
    level: 1
    count: 1
    variant: 0
test:
  - a
  - b
  - c
---



### Party Info

Players: `INPUT[number:playerCount]`
Player Level: `INPUT[number:playerLevel]`

### Enemies

%% | Name                        | Level                        | Count                        |
| --------------------------- | ---------------------------- | ---------------------------- |
| `INPUT[text:enemy[0].name]` | `INPUT[number:enemy[0].level]` | `INPUT[number:enemy[0].count]` |
| `INPUT[text:enemy[1].name]` | `INPUT[number:enemy[1].level]` | `INPUT[number:enemy[1].count]` |
| `INPUT[text:enemy[2].name]` | `INPUT[number:enemy[2].level]` | `INPUT[number:enemy[2].count]` |
| `INPUT[text:enemy[3].name]` | `INPUT[number:enemy[3].level]` | `INPUT[number:enemy[3].count]` |
| `INPUT[text:enemy[4].name]` | `INPUT[number:enemy[4].level]` | `INPUT[number:enemy[4].count]` |

```js
const mb = engine.getPlugin('obsidian-meta-bind-plugin').api;

function render(enemies) {
	const md = engine.markdown.createBuilder();
	md.createTable(
		['Name', 'Level', 'Count'], 
		enemies.map((x, i) => {
			return [
				`\`INPUT[text:enemy[${i}].name]\``,
				`\`INPUT[text:enemy[${i}].level]\``,
				`\`INPUT[text:enemy[${i}].count]\``
			]
		})
	);
	return md;
}

const signal = mb.createSignal([]);
const unregisterCb = mb.listenToMetadata(signal, context.file.path, ['enemy'], false);

const reactive = engine.reactive(render, signal.get());

component.register(unregisterCb);

return reactive;
``` 
%%


```js-engine
const mb = engine.getPlugin('obsidian-meta-bind-plugin').api;

const bindTarget = mb.createBindTarget('enemy');
const tableHead = ['Name', 'Level', 'Variant', 'Count'];
const columns = [
	mb.inputField.createInputFieldDeclarationFromString('INPUT[text:^.name]'),
	mb.inputField.createInputFieldDeclarationFromString('INPUT[number:^.level]'),
	mb.inputField.createInputFieldDeclarationFromString('INPUT[inlineSelect(option(-1, weak), option(0, normal), option(1, elite)):^.variant]'),
	mb.inputField.createInputFieldDeclarationFromString('INPUT[number:^.count]')
];

mb.createTable(container, context.file.path, component, bindTarget, tableHead, columns);
```


### Encounter Stats

```meta-bind-js-view
{enemy} and children as enemies
{playerCount} as playerCount
{playerLevel} as playerLevel
---

function getXP(enemyLevel) {
	const diff = enemyLevel - context.playerLevel;
	if (diff === -4) {
		return 10;
	}
	if (diff === -3) {
		return 15;
	}
	if (diff === -2) {
		return 20;
	}
	if (diff === -1) {
		return 30;
	}
	if (diff === 0) {
		return 40;
	}
	if (diff === 1) {
		return 60;
	}
	if (diff === 2) {
		return 80;
	}
	if (diff === 3) {
		return 120;
	}
	if (diff === 4) {
		return 160;
	}
	return -1;
}

function calculateTotalXP() {
	let acc = 0;
	for (const enemy of context.enemies) {
		const xp = getXP((enemy.level ?? 0) + (enemy.variant ?? 0));
		if (xp === -1) {
			return -1;
		}
		acc += xp * (enemy.count ?? 0);
	}
	return acc;
}

return "Encounter XP: " + calculateTotalXP()
```

> [!info] XP Reference
> 
> | Trivial                    | Low                        | Moderate                   | Severe                     | Extreme                    |
> | -------------------------- | -------------------------- | -------------------------- | -------------------------- | -------------------------- |
> | `VIEW[{playerCount} * 10]`    | `VIEW[{playerCount} * 15]`     | `VIEW[{playerCount} * 20]`    | `VIEW[{playerCount} * 30]`    | `VIEW[{playerCount} * 40]`    |