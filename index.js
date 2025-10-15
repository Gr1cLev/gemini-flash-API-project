import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// **Set your default Gemini model here:**
const GEMINI_MODEL = 'gemini-2.5-flash';

app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

function extractText(resp) {
  try {
    const text =
      resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      resp?.candidates?.[0]?.content?.parts?.[0]?.text ??
      resp?.response?.candidates?.[0]?.content?.text;

    return text ?? JSON.stringify(resp, null, 2);
  } catch (err) {
    console.error("Error extracting text:", err);
    return JSON.stringify(resp, null, 2);
  }
}

// 1 Generate text
app.post('/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    const resp = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt
    });
    res.json({ result: extractText(resp) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2 Generate From Image
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const { prompt } = req.body;
    const imageBase64 = req.file.buffer.toString('base64');

    const resp = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: imageBase64
              }
            }
          ]
        }
      ]
    });

    res.json({ result: extractText(resp) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3 Generate From Audio
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const { prompt } = req.body;
    const audioBase64 = req.file.buffer.toString('base64');

    const resp = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt || 'Transkrip audio berikut:' },
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: audioBase64
              }
            }
          ]
        }
      ]
    });

    res.json({ result: extractText(resp) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4 Generate From Document
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Document file is required' });
    }

    const { prompt } = req.body;
    const docBase64 = req.file.buffer.toString('base64');

    const resp = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt || 'Ringkas dokumen berikut:' },
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: docBase64
              }
            }
          ]
        }
      ]
    });

    res.json({ result: extractText(resp) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


