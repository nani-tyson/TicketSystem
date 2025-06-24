import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
// Routes
import userRoutes from './routers/userRoutes.js';
import ticketRoutes from './routers/ticketRoutes.js';
// inngest
import { serve } from 'inngest/express';
import { inngest } from './inngest/client.js';
import { onUserSignup } from './inngest/functions/on-singup.js';
import { onTicketCreated } from './inngest/functions/on-ticket-create.js';

const app = express();
dotenv.config();

connectDB();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // <-- Add this line

app.use("/api/auth", userRoutes);
app.use("/api/tickets", ticketRoutes);

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [onUserSignup, onTicketCreated],
  })
);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});