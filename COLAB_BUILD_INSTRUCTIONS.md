# 🚀 Build Simbi ScreenWriter Pro on Google Colab

If you do not have Android Studio installed locally, you can easily build your Android `.apk` file for free in **Google Colab**!

---

### Step 1: Export Your Project as a ZIP
1. In the **Google AI Studio** UI, click on the **Settings Menu** (or export controls).
2. Download the project as a **ZIP** file (e.g. `simbi-app.zip`).

---

### Step 2: Open Google Colab
1. Navigate to: [colab.research.google.com](https://colab.research.google.com/)
2. Create a new **Python 3 Notebook**.

---

### Step 3: Run the Compilation Script
Create a new code cell in your Colab notebook, paste the script below, and run it. It will prompt you to upload your ZIP file, automatically configure Java, Android SDK tools, and compile your secure debug APK!

```python
# ==========================================================
# 📱 Simbi ScreenWriter Pro - Colab Build Script
# ==========================================================
import os
import shutil
from google.colab import files

print("📤 1. Please upload your exported project ZIP file:")
uploaded = files.upload()
if not uploaded:
    raise Exception("No file uploaded. Please upload the exported project zip!")
zip_filename = list(uploaded.keys())[0]

print("⚙️ 2. Extracting workspace zip...")
!unzip -q {zip_filename} -d app_workspace
os.chdir("app_workspace")

# Sometimes the zip has a nested folder with the same name, let's defensively check and flatten it
if not os.path.exists("settings.gradle.kts") and not os.path.exists("app"):
    subdirs = [d for d in os.listdir('.') if os.path.isdir(d) and not d.startswith('.')]
    if len(subdirs) == 1:
        nested_dir = subdirs[0]
        print(f"📦 Found nested directory: {nested_dir}. Flattening files to workspace root...")
        for item in os.listdir(nested_dir):
            shutil.move(os.path.join(nested_dir, item), ".")
        os.rmdir(nested_dir)

print("🟢 3. Installing openjdk-17-jdk-headless...")
!apt-get install -y openjdk-17-jdk-headless > /dev/null

print("📦 4. Downloading official Gradle 8.7 Binary Build...")
!wget -q https://services.gradle.org/distributions/gradle-8.7-bin.zip
print("📦 5. Unzipping Gradle binary...")
!unzip -q gradle-8.7-bin.zip

print("📦 6. Downloading Android Command Line tools...")
!mkdir -p sdk/cmdline-tools
!wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
!unzip -q commandlinetools-linux-11076708_latest.zip -d sdk/cmdline-tools/
!mv sdk/cmdline-tools/cmdline-tools sdk/cmdline-tools/latest

# Configure Environment Variables dynamically
os.environ["JAVA_HOME"] = "/usr/lib/jvm/java-17-openjdk-amd64"
os.environ["ANDROID_HOME"] = os.path.abspath("sdk")
os.environ["PATH"] = f"{os.path.abspath('gradle-8.7/bin')}:{os.environ['ANDROID_HOME']}/cmdline-tools/latest/bin:{os.environ['ANDROID_HOME']}/platform-tools:{os.environ['PATH']}"

print("📜 7. Accepting Android SDK Licences...")
# Auto-accept all android licences
!yes | sdkmanager --licenses > /dev/null
!sdkmanager "platforms;android-35" "build-tools;35.0.0" "platform-tools" > /dev/null

print("🏗️ 8. Compiling Android Debug APK...")
!gradle assembleDebug --no-daemon --stacktrace

# Locate and download the built APK
apk_path = "app/build/outputs/apk/debug/app-debug.apk"
if os.path.exists(apk_path):
    print("\n🎉 SUCCESS! Downloading your compiled Simbi APK back to your machine:")
    files.download(apk_path)
else:
    print("\n❌ Build failed. Please check build logs above for compilation errors.")
```

---

### Alternative: GitHub Actions (Recommended)
We have updated your Github Workflow configuration block at `.github/workflows/build-android.yml`.
Simply **push this code to GitHub**! The GitHub Actions workflow will automatically run, configure the build servers, compile the code, and host the **`Simbi-ScreenWriter-Debug-APK`** inside the compilation run summary screen under the **Artifacts** section as a downloadable zip.
