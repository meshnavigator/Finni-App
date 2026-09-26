
from pathlib import Path
p=Path('src/ui/HomeScreen.tsx');s=p.read_text(encoding='utf-8')
s=s.replace("import type { SceneRect }", "import { homeNextStep } from './home-next-step.ts';\nimport type { SceneRect }")
a=s.index("  const next = life.state");b=s.index("  const blocked =",a)
s=s[:a]+"""  const next = homeNextStep({ state: life.state, hasFood, hasCare, hasGoal: Boolean(goal), allGoals, savings: life.savings, large });
  const runNext = () => {
    if (next.route === 'open-day') props.onOpenDay();
    else if (next.route === 'results') props.onResults();
    else if (next.route !== 'waiting') props.onSection(next.route);
  };
  const portraitSize = short ? 120 : 152;
"""+s[b:]
s=s.replace("width: 112, height: 112", "width: portraitSize, height: portraitSize",1)
s=s.replace("y: short ? 12 : 34", "y: short ? 8 : 34")
s=s.replace("(short ? 54 : 84)", "(short ? 46 : 84)")
s=s.replace("onPress={next.run}", "onPress={runNext}")
s=s.replace("styles.primary, large &&", "styles.primary, short && styles.shortPrimary, large &&")
s=s.replace("    {!large && !blocked && <Icon name=\"arrow\" size={20} />}\n", "")
s=s.replace('accessibilityLabel="Меню" onPress={() => setMenu(true)}','accessibilityLabel={canSkip ? \'Пропустить анимацию\' : \'Меню\'} onPress={() => canSkip ? setSkipReactionId(props.reaction!.id) : setMenu(true)}')
s=s.replace('<Text style={styles.caption}>Меню</Text>',"<Text style={styles.caption}>{canSkip ? 'Пропуск' : 'Меню'}</Text>")
s=s.replace("large && styles.largeState]", "large && [styles.largeState, { marginLeft: portraitSize + 10 }]]")
s=s.replace("styles.finances, large &&", "styles.finances, short && !large && styles.shortFinances, large &&")
s=s.replace("styles.money, large &&", "styles.money, short && !large && styles.shortMoney, large &&")
s=s.replace("styles.amount, large &&", "styles.amount, short && !large && styles.shortAmount, large &&")
s=s.replace("styles.goal, large &&", "styles.goal, short && !large && styles.shortGoal, large &&")
s=s.replace("style={styles.goalArt}","style={[styles.goalArt, short && styles.shortGoalArt]}")
s=s.replace("style={styles.goalImage}","style={[styles.goalImage, short && styles.shortGoalImage]}")
s=s.replace("<Text style={styles.caption}>{life.savings} из {goal.cost} монет</Text>", "<Text style={styles.caption}>{life.savings} из {goal.cost}{short && !large ? ' · ещё ' + remaining : ' монет'}</Text>")
s=s.replace("<Text style={styles.caption}>{remaining === 0 ? 'Можно получить мечту' : 'Осталось ' + remaining}</Text>", "{(!short || large) && <Text style={styles.caption}>{remaining === 0 ? 'Можно получить мечту' : 'Осталось ' + remaining}</Text>}")
s=s.replace("large && styles.largeScene]", "large && [styles.largeScene, { height: portraitSize }]]")
s=s.replace("large ? styles.portrait :", "large ? [styles.portrait, { width: portraitSize, height: portraitSize }] :")
s=s.replace("height={large ? 112 :", "height={large ? portraitSize :")
s=s.replace("large ? styles.portraitTarget :", "large ? [styles.portraitTarget, { width: portraitSize, height: portraitSize }] :")
s=s.replace("petRegion.y + (short ? 36 : 24)", "petRegion.y + (short ? 48 : 24)")
s=s.replace("petRegion.height - (short ? 36 : 24)", "petRegion.height - (short ? 48 : 24)")
s=s.replace("styles.lesson, large &&", "styles.lesson, short && !large && styles.shortLesson, large &&")
s=s.replace("styles.nav, large &&", "styles.nav, short && !large && styles.shortNav, large &&")
s=s.replace("styles.navItem, large &&", "styles.navItem, short && !large && styles.shortNavItem, large &&")
s=s.replace("shortHome: { padding: 10, gap: 7 }", "shortHome: { padding: 10, gap: 6 }")
s=s.replace("  largeFinances:", "  shortFinances: { padding: 10 }, shortMoney: { paddingBottom: 6 }, shortAmount: { fontSize: 20, lineHeight: 23 },\n  shortGoal: { minHeight: 54, paddingTop: 6, gap: 8 }, shortGoalArt: { width: 48, height: 48, borderRadius: 14 }, shortGoalImage: { width: 46, height: 46 },\n  largeFinances:")
s=s.replace("  lessonCopy:", "  shortLesson: { minHeight: 56, padding: 8 }, shortPrimary: { minHeight: 48 }, shortNav: { minHeight: 56 }, shortNavItem: { minHeight: 48 },\n  lessonCopy:")
p.write_text(s,encoding='utf-8')
p=Path('src/ui/home-scene-layout.ts');s=p.read_text();s=s.replace("(region.width - 8) / 520, (region.height - 8) / 440", "(region.width - 4) / 430, (region.height - 8) / 365");p.write_text(s,encoding='utf-8')

