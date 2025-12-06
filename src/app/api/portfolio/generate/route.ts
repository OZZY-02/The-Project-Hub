import { NextResponse } from 'next/server';
import path from 'path';
import dotenv from 'dotenv';

// Force load .env.local to ensure OPENAI_API_KEY is available (Fix for local dev)
try {
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
} catch (e) {
    console.error("Failed to load .env.local", e);
}

// Secure intermediary between the frontend and the OpenAI Responses API.
const apiKey = process.env.OPENAI_API_KEY || "";
const modelId = process.env.OPENAI_MODEL_ID || "gpt-4o-mini";

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
    type: "object",
    additionalProperties: false,
    properties: {
        professional_headline: { 
            type: "string", 
            description: "A concise, attention-grabbing professional headline (like a LinkedIn title)." 
        },
        optimized_bio: { 
            type: "string", 
            description: "A rewritten, professional summary paragraph (max 100 words) tailored to the user's goal." 
        },
        key_project_summary: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    project_title: { type: "string" },
                    summary_point_1: { 
                        type: "string", 
                        description: "A bullet point summarizing the problem solved (S- Situation/Problem)." 
                    },
                    summary_point_2: { 
                        type: "string", 
                        description: "A bullet point summarizing the actions taken and skills used (A- Action/Skill)." 
                    },
                    summary_point_3: { 
                        type: "string", 
                        description: "A bullet point quantifying the result or impact (R- Result/Impact)." 
                    }
                },
                required: ["project_title", "summary_point_1", "summary_point_2", "summary_point_3"]
            }
        },
        visual_style: {
            type: "object",
            additionalProperties: false,
            properties: {
                theme_color: { type: "string", description: "A primary hex color code (e.g. #1e40af) that matches the user's professional vibe." },
                background_gradient_start: { type: "string", description: "Start color for background gradient." },
                background_gradient_end: { type: "string", description: "End color for background gradient." },
                font_style: { type: "string", description: "Suggested font style: 'modern', 'classic', 'tech', or 'playful'." }
            },
            required: ["theme_color", "background_gradient_start", "background_gradient_end", "font_style"]
        }
    },
    required: ["professional_headline", "optimized_bio", "key_project_summary", "visual_style"]
};


export async function POST(request: Request) {
    if (!apiKey) {
        return NextResponse.json({ success: false, message: "Missing OPENAI_API_KEY" }, { status: 500 });
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
        const apiUrl = "https://api.openai.com/v1/responses";

        const payload = {
            model: modelId,
            instructions: systemPrompt,
            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: userQuery
                        }
                    ]
                }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "portfolio_schema",
                    schema: responseSchema,
                    strict: true
                }
            }
        };

        // --- 3. Call the OpenAI Responses API ---
        const response = await fetchWithBackoff(apiUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.error) {
            console.error('OpenAI API error:', result.error);
            return NextResponse.json({ success: false, message: "AI generation failed.", detail: result.error }, { status: 500 });
        }

        const outputText = (result.output || [])
            .flatMap((item: any) =>
                (item.content || [])
                    .filter((part: any) => part.type === 'output_text')
                    .map((part: any) => part.text)
            )
            .join('\n')
            .trim();

        if (!outputText) {
            console.error('OpenAI API returned no usable content:', result);
            return NextResponse.json({ success: false, message: "AI generation returned empty content.", detail: result }, { status: 500 });
        }

        let parsedJson;
        try {
            parsedJson = JSON.parse(outputText);
        } catch (parseError) {
            console.error('Failed to parse OpenAI JSON response:', parseError, outputText);
            return NextResponse.json({ success: false, message: "AI returned invalid JSON.", detail: String(parseError) }, { status: 500 });
        }

        return NextResponse.json({ success: true, portfolio: parsedJson }, { status: 200 });

    } catch (error: any) {
        console.error("OpenAI API Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error during AI processing.", detail: String(error) }, { status: 500 });
    }
}
