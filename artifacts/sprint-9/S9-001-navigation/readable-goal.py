from pathlib import Path
p=Path('src/ui/SavingsScreen.tsx');s=p.read_text(encoding='utf-8')
a=s.index('            <Button\n              disabled={props.busy || lifecycle.savings < selected.cost}')
b=s.index('        </View>}',a)
s=s[:a]+'''          {lifecycle.savings < selected.cost
            ? <Text style={styles.caption}>Осталось накопить {selected.cost - lifecycle.savings}</Text>
            : <Button disabled={props.busy} label="Получить цель" onPress={claim} />}
'''+s[b:]
p.write_text(s,encoding='utf-8')
