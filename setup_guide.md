# Enterprise Task Management Suite - Configuration & Setup Guide

This guide explains how to open, build, run, configure, and test the **Enterprise Task Management Suite** using your local tools: **Docker, GitHub, IntelliJ IDEA, VS Code, and Postman**, and how to deploy the entire suite to live production servers.

---

## 1. Local Git & GitHub Setup
Track your source files and upload them to GitHub.

1. Open a terminal in the project root:
   ```bash
   cd "C:\Users\atulv\OneDrive\Desktop\ENTERPRISE PROJECT"
   ```
2. Initialize repository and commit current files:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit with premium frontend, Spring Boot backend, and Docker configs"
   ```
3. Set your branch to `main`:
   ```bash
   git branch -M main
   ```
4. Link your remote GitHub repository and push:
   - Create a new **Public or Private** repository on GitHub named `enterprise-task-suite` (do NOT initialize it with a README or .gitignore).
   - Link and push the code:
     ```bash
     git remote add origin https://github.com/<your-github-username>/enterprise-task-suite.git
     git push -u origin main
     ```

---

## 2. Editor & IDE Settings

### IntelliJ IDEA (For the Spring Boot Backend)
IntelliJ is optimized for Spring Boot applications.
1. Launch **IntelliJ IDEA**.
2. Go to **File -> Open** and select the `backend` folder inside `ENTERPRISE PROJECT`.
3. IntelliJ will discover `pom.xml` and import dependencies automatically. Allow it to index the project.
4. **Configure Java SDK**: If prompted, set the project JDK to **Java 17** (or download it directly within IntelliJ).
5. **Run Locally**:
   - Locate [TaskManagerApplication.java](file:///c:/Users/atulv/OneDrive/Desktop/ENTERPRISE/PROJECT/backend/src/main/java/com/enterprise/taskmanager/TaskManagerApplication.java).
   - Right-click and select **Run 'TaskManagerApplication'**.
   - The application will start locally on `http://localhost:8080` using the in-memory H2 database.
   - Inspect database tables at: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:taskdb`, username: `sa`, password: `password`).

### VS Code (For the Web Frontend)
VS Code is highly optimized for web design.
1. Launch **VS Code**.
2. Select **File -> Open Folder** and open the `ENTERPRISE PROJECT` workspace folder.
3. Install the **Live Server** extension (by Ritwick Dey) if you haven't already.
4. Open the root [index.html](file:///c:/Users/atulv/OneDrive/Desktop/ENTERPRISE/PROJECT/index.html), right-click, and click **Open with Live Server**.
5. The landing portal launches, automatically talking to the local Spring Boot API (or falling back to Local Storage if the API is offline!).

---

## 3. Docker Compose Orchestration (Full-Stack Run)
Deploy the database, backend, and frontend containers simultaneously with a single command.

1. Open your terminal in the root `ENTERPRISE PROJECT` directory.
2. Build and launch all services in detached mode:
   ```bash
   docker compose up --build -d
   ```
3. Verify that all containers are active:
   ```bash
   docker compose ps
   ```
   You will see three containers:
   - `taskmanager-db` (PostgreSQL on port `5432`)
   - `taskmanager-backend` (Spring Boot API on port `8080`)
   - `taskmanager-frontend` (Nginx serving frontend on port `80`)
4. Access the web dashboard at: **`http://localhost`**
5. Inspect service logs:
   ```bash
   docker compose logs -f backend
   ```
6. Spin down containers:
   ```bash
   docker compose down
   ```

---

## 4. API Testing in Postman
Use Postman to test all REST endpoints.

1. Launch **Postman**.
2. Click **Import** in the top navigation panel.
3. Drag and drop the file [enterprise_task_suite.postman_collection.json](file:///c:/Users/atulv/OneDrive/Desktop/ENTERPRISE/PROJECT/enterprise_task_suite.postman_collection.json).
4. Run the requests to perform CRUD:
   - **Get All Tasks**: Fetch seeded tasks.
   - **Create Task**: Add a new Kanban card.
   - **Update Task**: Modify checklist markers or shift column states.
   - **Create User**: Add a profile to the admin roster directory.
   - **Get Summary Metrics**: View aggregate counts dynamically updating.

---

## 5. Render Production Deployment (Backend & Database)
Deploy your PostgreSQL database and Spring Boot application to **Render** for live cloud hosting.

### Step 5a: Deploy PostgreSQL Database
1. Sign in to your dashboard on [Render](https://render.com).
2. Click **New +** and select **PostgreSQL**.
3. Fill in database parameters:
   - **Name**: `taskmanager-db`
   - **Database Name**: `taskdb`
   - **Username**: `postgres`
   - **Region**: Select the region closest to you.
4. Click **Create Database**.
5. Once active, locate the **Internal Database URL** (e.g. `postgres://postgres:password@dpg-xxx-a.render.com/taskdb`). Keep this copy.

### Step 5b: Deploy Spring Boot Backend Web Service
1. Click **New +** on your Render dashboard and select **Web Service**.
2. Select **Build and deploy from a Git repository** and connect your GitHub repository `enterprise-task-suite`.
3. Configure the service parameters:
   - **Name**: `taskmanager-backend`
   - **Region**: Choose the same region as your database.
   - **Branch**: `main`
   - **Root Directory**: `backend` (Important: points to the Java project subdirectory)
   - **Runtime**: `Docker` (Render will discover the multi-stage `backend/Dockerfile` automatically)
4. Add the following **Environment Variables** in the service settings:
   - `SPRING_PROFILES_ACTIVE` = `docker`
   - `SPRING_DATASOURCE_URL` = `jdbc:postgresql://<EXTERNAL_DB_HOST>:<PORT>/taskdb` (Use the external connection host provided by Render Database dashboard)
   - `SPRING_DATASOURCE_USERNAME` = `postgres`
   - `SPRING_DATASOURCE_PASSWORD` = `<database-password>`
5. Click **Create Web Service**. Render will build and deploy the Spring Boot app.
6. Once active, note down your backend URL (e.g., `https://taskmanager-backend-xxxx.onrender.com`).

---

## 6. Vercel Production Deployment (Frontend)
Deploy the responsive frontend web panels to **Vercel** for lightning-fast edge hosting.

### Step 6a: Configure Dynamic Production URL
1. Open the Javascript files:
   - [dashboard.js](file:///c:/Users/atulv/OneDrive/Desktop/ENTERPRISE/PROJECT/user-dashboard/dashboard.js)
   - [board.js](file:///c:/Users/atulv/OneDrive/Desktop/ENTERPRISE/PROJECT/task-board/board.js)
   - [admin.js](file:///c:/Users/atulv/OneDrive/Desktop/ENTERPRISE/PROJECT/admin-panel/admin.js)
2. Replace `'https://taskmanager-backend-latest.onrender.com/api'` on Line 3 with your actual Render backend URL noted in Step 5b (e.g., `https://taskmanager-backend-xxxx.onrender.com/api`).
3. Commit and push these modifications to GitHub:
   ```bash
   git add .
   git commit -m "config: update production backend Render API endpoints"
   git push origin main
   ```

### Step 6b: Import and Run on Vercel
1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New** and select **Project**.
3. Import your GitHub repository `enterprise-task-suite`.
4. Configure Project settings:
   - **Framework Preset**: `Other` (or static HTML/CSS/JS)
   - **Root Directory**: `./` (Do NOT choose `backend`)
   - **Build Command**: Leave empty (no build step is required for static pages)
   - **Output Directory**: Leave empty
5. Click **Deploy**. Vercel will process and make your static pages live!
6. Once deployment finishes, Vercel gives you a public domain url (e.g., `https://enterprise-task-suite-xxxx.vercel.app`). Open this link in your browser to access the live dashboard!
