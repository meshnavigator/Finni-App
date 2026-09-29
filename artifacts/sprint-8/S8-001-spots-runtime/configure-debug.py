import subprocess
adb='C:/tmp/finni-s2-006-android-sdk/platform-tools/adb.exe'
subprocess.run([adb,'shell','am','force-stop','com.meshnavigator.finni'],check=True)
subprocess.run([adb,'shell','run-as','com.meshnavigator.finni','mkdir','-p','shared_prefs'],check=True)
xml=b'<?xml version="1.0" encoding="utf-8" standalone="yes" ?><map><string name="debug_http_host">localhost:8082</string></map>'
subprocess.run([adb,'shell','run-as','com.meshnavigator.finni','sh','-c',"'cat > shared_prefs/com.meshnavigator.finni_preferences.xml'"],input=xml,check=True)
subprocess.run([adb,'shell','am','start','-n','com.meshnavigator.finni/.MainActivity'],check=True)
