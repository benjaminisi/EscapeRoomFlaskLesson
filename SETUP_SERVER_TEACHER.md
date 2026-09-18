# SETUP_SERVER_TEACHER.md - Linux Server Setup Guide for Teachers

Welcome! This guide walks you through setting up the **Cyber Escape Room** on your classroom Linux server machine so students can participate from their laptops over the local classroom network (LAN).

---

## 1. Prerequisites on the Linux Server

Your Linux machine needs **Docker** (or **Podman**) and its Compose utility.

### If Docker or Podman is already installed:
Run this check in your terminal:
```bash
# For Docker:
docker --version
docker compose version

# For Podman:
podman --version
podman-compose --version
```
If either toolset prints version numbers, you are ready for Section 2 (use `podman-compose` instead of `docker compose` if running Podman).

### If Docker is NOT installed yet:
Run the official automated install script (Ubuntu/Debian):
```bash
# 1. Install Docker Engine
curl -fsSL https://get.docker.com | sudo sh

# 2. Allow your user account to run Docker without sudo
sudo usermod -aG docker $USER

# 3. Apply group permissions (or log out and log back in)
newgrp docker
```

---

## 2. Setting Up the Project

### Step 2.1: Clone the Repository
Open a terminal on the Linux server and clone your classroom repository:
```bash
git clone https://github.com/benjaminisi/EscapeRoomFlaskLesson.git
cd EscapeRoomFlaskLesson
```
*(Or navigate to your existing local git directory).*

### Step 2.2: Ensure Scripts Have Execute Permissions
```bash
chmod +x entrypoint.sh deploy-branch.sh
```

---

## 3. Finding Your Classroom Server IP Address

To allow student laptops to connect, find the Linux server's IP address on the local classroom Wi-Fi or Ethernet:

```bash
hostname -I
```
Look for an IP address in one of these standard local network ranges:
- `192.168.x.x`
- `10.x.x.x`
- `172.16.x.x` to `172.31.x.x`

> **Teacher Note**: If `hostname -I` prints multiple numbers, the first one (or the one matching your classroom subnet) is your server IP. For example: `192.168.1.45`.

---

## 4. Opening the Firewall (If Active)

If your Linux machine has the **UFW** firewall enabled, allow incoming web traffic on port 3000:

```bash
sudo ufw allow 3000/tcp
```
*(If UFW is inactive or disabled, no firewall change is necessary).*

---

## 5. Starting the Container Lab

Start the Escape Room container with a single command:

```bash
# Docker:
docker compose up -d

# Podman:
podman-compose up -d
```

### Check That Everything is Running
```bash
# Docker:
docker compose ps

# Podman:
podman ps
```
You should see `escaperoom-lab` listed with status `Up`.

### View Live Game Activity & Logs
```bash
# Docker:
docker compose logs -f

# Podman:
podman logs -f escaperoom-lab
```
*(Press `Ctrl + C` anytime to exit the log viewer; the container continues running in the background).*

---

## 6. How Students Connect

1. Ensure the student laptops are connected to the same classroom Wi-Fi or wired network switch as the Linux server.
2. Direct students to open any web browser (Chrome, Edge, Firefox, Safari) and enter:
   ```text
   http://<YOUR-SERVER-IP>:3000
   ```
   *Example*: `http://192.168.1.45:3000`
3. Students will see the **CYBER_ESCAPE // CHAMBER_01** operative selection screen, pick their operative, and enter the grid!

---

## 7. Connecting to MySQL for Teaching & Live Demonstrations

The MySQL database container exposes port `3306` directly to the host machine. You can connect using any desktop database tool (e.g. **MySQL Workbench**, **DBeaver**, **TablePlus**, **VS Code MySQL Extension**) or terminal CLI.

### Connection Parameters:
| Setting | Value |
| :--- | :--- |
| **Host** | `127.0.0.1` (or `localhost`) |
| **Port** | `3306` |
| **Database** | `escaperoom` |
| **Username** | `escaperoom` |
| **Password** | `escaperoom_pass` |
| **Root Password** | `root_escaperoom` |

### Quick Terminal CLI Connection:
```bash
mysql -h 127.0.0.1 -P 3306 -u escaperoom -pescaperoom_pass escaperoom
```

### 🎓 Classroom Transaction Demonstration Idea:
Because the database runs the transactional **InnoDB** engine and the frontend UI polls the server every **2.5 seconds**, you can demonstrate transaction isolation live on the classroom projector:

1. **Step 1 - Inspect live player coordinates**:
   ```sql
   SELECT name, x, y, steps_taken FROM players;
   ```
2. **Step 2 - Begin a transaction and stage an uncommitted update**:
   ```sql
   START TRANSACTION;
   UPDATE players SET x = 3, y = 3 WHERE name = 'OperativeAlpha';
   ```
   *Point out to the class*: Even though the update was executed in SQL, the operative on the student's screen **does not move** because the transaction is not yet committed (isolation / dirty read protection).
3. **Step 3 - Commit the transaction**:
   ```sql
   COMMIT;
   ```
   *Watch the screen*: Within **2.5 seconds** (on the next client polling sync), the player's avatar instantly moves to coordinate `(3, 3)` across all connected screens!
4. **Step 4 - Rollback demonstration**:
   ```sql
   START TRANSACTION;
   UPDATE puzzles SET solved = 1 WHERE id = 'puz_1';
   -- Show that students still see it locked
   ROLLBACK;
   -- The puzzle remains locked
   ```

---

## 8. Stopping the Server at End of Class

When class is finished:
```bash
# Docker:
docker compose down

# Podman:
podman-compose down
```
All player progress and puzzle state are preserved in the `mysql_data` volume and will automatically restore next time you run `docker compose up -d` or `podman-compose up -d`.
