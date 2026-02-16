# JuaClima

Interactive climate dashboard platform to collect, visualize, and
analyze climate data. This project combines a frontend dashboard with a
Python backend to support climate insights and decision-making.

------------------------------------------------------------------------

## 🌍 Overview

JuaClima is a **climate data dashboard** designed to help users explore
climate trends, visualize weather and climate model outputs, and support
climate resilience and planning.

The name *"JuaClima"* combines **"Jua" (sun in Swahili)** and climate,
reflecting its focus on climate insights relevant to East Africa and
beyond.

This repository contains:

-   A **client** application (dashboard UI)
-   A **server** backend powered by Python
-   Supporting configuration and modules

------------------------------------------------------------------------

## 🚀 Features

-   Climate data visualization dashboard
-   Interactive charts and analytics
-   Backend API for climate data
-   Modular client-server architecture
-   Extensible for future climate datasets

------------------------------------------------------------------------

## 🧠 Architecture

The project follows a **client-server architecture**:

### Client (`/client`)

Contains the frontend dashboard:

-   User interface components
-   Data visualization elements
-   Connects to backend API

### Server (`/server`)

Contains the backend:

-   Python API
-   Climate data processing
-   Data serving to frontend

------------------------------------------------------------------------

## 🛠️ Getting Started

### Prerequisites

Install:

-   Python 3.8+
-   Node.js and pnpm

------------------------------------------------------------------------

## ⚙️ Server Setup

``` bash
git clone https://github.com/LucylleMakachia/JuaClima.git
cd JuaClima/server
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
python app.py
```

------------------------------------------------------------------------

## 💻 Client Setup

``` bash
cd JuaClima/client
npm install
npm start
```

------------------------------------------------------------------------

## 📁 Project Structure

JuaClima/ client/ server/ logs/ requirements.txt package.json README.md

------------------------------------------------------------------------

## 📄 License

MIT License

------------------------------------------------------------------------

## 👤 Author

Lucylle Makachia https://github.com/LucylleMakachia
