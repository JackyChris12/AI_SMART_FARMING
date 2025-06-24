# AI_SMART_FARMING

AgroAi is an AI-powered agricultural assistant designed to support smallholder and local farmers by providing fast, reliable advice for smarter farming. The platform offers AI chat assistance, crop and livestock diagnosis, weather tips, and personalized recommendations to help farmers improve yield and farm management.

## Features

- 🧠 **AI Chat Assistant**: Ask questions about pests, diseases, fertilizers, and farming techniques.
- 🌿 **Crop Diagnosis**: Describe symptoms or upload crop images to get diagnosis and treatment suggestions.
- 🐄 **Livestock Diagnosis**: Receive advice on livestock diseases and treatments.
- 🌦️ **Smart Weather Tips**: Get local weather forecasts and planting advice based on conditions.
- 📌 **Personalized Recommendations**: Discover suitable crops and animals based on soil type, region, or climate.
- User authentication with registration, login, and session management.
- Secure image uploads for diagnosis.
- Restricts AI assistance to agriculture-related queries for focused support.

## Technologies Used

- Node.js
- Express.js
- EJS templating engine
- MySQL (with mysql2)
- Express-session and express-mysql-session for session management
- Multer for file uploads
- Bcrypt for password hashing
- Axios for HTTP requests
- dotenv for environment variable management
- OpenAI API (via openrouter.ai) for AI-powered responses

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/agroai.git
   cd agroai
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and configure the following environment variables:

   ```env
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASS=your_database_password
   DB_NAME=agroai
   API_KEY=your_openai_api_key
   APP_PORT=3000
   ```

4. Set up your MySQL database and import the schema from `database.qsl` if available.

## Running the Application

Start the development server with:

```bash
npm start
```

The server will run on `http://localhost:3000` by default (or the port specified in `APP_PORT`).

## Usage

- Register a new user account or log in with existing credentials.
- Use the AI chat assistant to ask agriculture-related questions.
- Navigate to the Diagnosis page to upload crop images or describe symptoms for AI-powered diagnosis.
- Explore crops and livestock information pages.
- Log out when finished.

## Project Structure

```
.
├── app.js                 # Main application setup
├── package.json           # Project metadata and dependencies
├── routes/
│   └── index.js           # Main route definitions and handlers
├── middleware/
│   └── auth.js            # Authentication middleware
├── modules/
│   └── db.js              # MySQL connection pool setup
├── views/                 # EJS templates for UI
├── public/                # Static assets (CSS, images, scripts)
├── uploads/               # Uploaded images storage
├── database.qsl           # Database schema
└── .env                   # Environment variables (not committed)
```

## Environment Variables

- `DB_HOST`: MySQL database host (default: localhost)
- `DB_USER`: MySQL database user (default: root)
- `DB_PASS`: MySQL database password
- `DB_NAME`: MySQL database name (default: agroai)
- `API_KEY`: API key for OpenAI or OpenRouter AI service
- `APP_PORT`: Port for the Express server (default: 3000)

## License

This project is (closed-source)

## Author

JACKLINE KIBIWOT AI_SMART_FARMING web developer

---

Thank you for using AgroAi! If you have any questions or want to contribute, feel free to open issues or pull requests.

## 📸 Screenshot

![Homepage Screenshot](./images/homepage.jpg)
![Homepage Screenshot](./images/diagnosis_page.jpg)
![Homepage Screenshot](./images/Equipment_page.jpg)
![Homepage Screenshot](./images/Livestock_monitoring_page.jpg)
![Homepage Screenshot](./images/Livstock-logs_page.jpg)
![Homepage Screenshot](./images/login_page.jpg)
![Homepage Screenshot](./images/register_page.jpg)
![Homepage Screenshot](./images/renting-form_page.jpg)
![Homepage Screenshot](./images/Profile_page.jpg)

