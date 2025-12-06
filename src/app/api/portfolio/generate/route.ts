import { NextResponse } from 'next/server';

// This route acts as the secure intermediary between your frontend and the Gemini API.
// NOTE: Add GEMINI_API_KEY to your .env.local and Vercel environment.
const apiKey = process.env.GEMINI_API_KEY || "";

// Exponential Backoff for retries
const maxRetries = 3;
const initialDelay = 1000;

async function fetchWithBackoff(url: string, options: RequestInit, retries = 0): Promise<Response> {
    try {
        const response = await fetch(url, options);
        if (!response.ok && retries < maxRetries) {
            const delay = initialDelay * Math.pow(2, retries);
            console.warn(`API call failed with status ${response.status}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithBackoff(url, options, retries + 1);
        }
        return response;
    } catch (error) {
        if (retries < maxRetries) {
            const delay = initialDelay * Math.pow(2, retries);
            console.warn(`API call failed: ${error}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithBackoff(url, options, retries + 1);
        }
        throw new Error(`API call failed after ${maxRetries} attempts.`);
    }
}

// Define the required structured output for the portfolio summary
const responseSchema = {
    type: "OBJECT",
    properties: {
        professional_headline: { 
            type: "STRING", 
            description: "A concise, attention-grabbing professional headline (like a LinkedIn title)." 
        },
        optimized_bio: { 
            type: "STRING", 
            description: "A rewritten, professional summary paragraph (max 100 words) tailored to the user's goal." 
        },
        key_project_summary: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    project_title: { type: "STRING" },
                    summary_point_1: { 
                        type: "STRING", 
                        description: "A bullet point summarizing the problem solved (S- Situation/Problem)." 
                    },
                    summary_point_2: { 
                        type: "STRING", 
                        description: "A bullet point summarizing the actions taken and skills used (A- Action/Skill)." 
                    },
                    summary_point_3: { 
                        type: "STRING", 
                        description: "A bullet point quantifying the result or impact (R- Result/Impact)." 
                    }
                }
            },
        },
        visual_style: {
            type: "OBJECT",
            properties: {
                theme_color: { type: "STRING", description: "A primary hex color code (e.g. #1e40af) that matches the user's professional vibe." },
                background_gradient_start: { type: "STRING", description: "Start color for background gradient." },
                background_gradient_end: { type: "STRING", description: "End color for background gradient." },
                font_style: { type: "STRING", description: "Suggested font style: 'modern', 'classic', 'tech', or 'playful'." }
            }
        }
    },
    required: ["professional_headline", "optimized_bio", "key_project_summary", "visual_style"]
};


export async function POST(request: Request) {
    if (!apiKey) {
        return NextResponse.json({ success: false, message: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    try {
        const { userData, userGoal } = await request.json();

        if (!userData) {
            return NextResponse.json({ success: false, message: "Missing userData in request body" }, { status: 400 });
        }

        // --- 1. Construct the detailed prompt ---
        const userProjects = (userData.projects || []).map((p: any) => 
            `Project Title: ${p.name || p.project_title_en || 'Untitled'}. Role: ${p.user_role || 'Creator'}. Description: ${p.description || p.description_en || ''}`
        ).join('\n---\n');

        const userSkills = (userData.skills || []).map((s: any) => 
            typeof s === 'string' ? s : `${s.skill_name} (${s.proficiency_level || 3}/5)`
        ).join(', ');

        const systemPrompt = `You are a world-class career coach and professional portfolio writer. Your goal is to analyze the provided maker data and rewrite the profile sections to be highly professional, impactful, and focused on the user's stated goal: '${userGoal || 'showcase their work'}'. 
        Follow the STAR method (Situation, Task, Action, Result) for project summaries and ensure the final output is provided ONLY in the specified JSON schema. Do not include any introductory or conversational text outside of the JSON block.`;

        const userQuery = `
            Analyze the following maker's data and generate a custom portfolio:
            - Name: ${userData.first_name || ''} ${userData.last_name || ''}
            - College: ${userData.college || ''}
            - Major/Passion: ${userData.major_field || ''} in ${userData.passion_sector || ''}
            - Current Skills: ${userSkills || userData.skills?.join(', ') || 'Not specified'}
            - Languages: ${(userData.languages || []).join(', ') || 'Not specified'}
            - Certifications: ${(userData.certifications || []).join(', ') || 'None'}
            - Summary: ${userData.summary || 'No summary provided'}
            - Projects (Re-summarize these using the STAR method in 3 points each):
            ${userProjects || 'No projects listed'}
        `;
        
        // --- 2. Construct the API payload for structured output ---
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        };

        // --- 3. Call the Gemini API ---
        const response = await fetchWithBackoff(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0) {
            const jsonText = result.candidates[0].content.parts[0].text;
            const parsedJson = JSON.parse(jsonText);
            
            // Return the structured portfolio data to the frontend
            return NextResponse.json({ success: true, portfolio: parsedJson }, { status: 200 });
        }

        console.error('Gemini API returned no candidates:', result);
        return NextResponse.json({ success: false, message: "AI generation failed or returned no candidates.", detail: result }, { status: 500 });

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error during AI processing.", detail: String(error) }, { status: 500 });
    }
}
