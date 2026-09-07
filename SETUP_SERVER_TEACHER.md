# SETUP_SERVER_TEACHER.md - Linux Server Setup Guide for Teachers

Welcome! This guide walks you through setting up the **Cyber Escape Room** on your classroom Linux server machine so students can participate from their laptops over the local classroom network (LAN).

---

## 1. Prerequisites on the Linux Server

Your Linux machine needs **Docker** and **Docker Compose**.

### If Docker is already installed:
Run this check in your terminal:
```bash
docker --version
docker compose version
```
If both commands print version numbers, you are ready for Section 2.

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
docker compose up -d
```

### Check That Everything is Running
```bash
docker compose ps
```
You should see `escaperoom-lab` listed with status `Up`.

### View Live Game Activity & Logs
```bash
docker compose logs -f
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

## 7. Stopping the Server at End of Class

When class is finished:
```bash
docker compose down
```
All player progress is saved in `backend/escaperoom.db` and will be restored next time you run `docker compose up -d`.
