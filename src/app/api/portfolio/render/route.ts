import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: Request) {
  try {
    const { portfolioData, template = 'modern' } = await request.json();

    if (!portfolioData) {
      return NextResponse.json({ success: false, message: 'Missing portfolioData' }, { status: 400 });
    }

    const {
      name = 'Your Name',
      headline = 'Professional Headline',
      bio = 'Your professional bio goes here.',
      skills = [],
      projects = [],
      profileImage = null,
      visualStyle = {},
    } = portfolioData;

    // Build HTML for the portfolio
    const html = generatePortfolioHTML({
      name,
      headline,
      bio,
      skills,
      projects,
      profileImage,
      template,
      visualStyle,
    });

    // Launch puppeteer and render to image
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set viewport for full portfolio
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    
    // Set content
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Wait for images to load
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(resolve => {
            img.onload = img.onerror = resolve;
          }))
      );
    });

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
    });

    await browser.close();

    // Return as base64 data URL
    const base64 = Buffer.from(screenshot).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({
      success: true,
      image: dataUrl,
      message: 'Portfolio image generated successfully',
    });
  } catch (error: any) {
    console.error('Portfolio render error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to render portfolio' },
      { status: 500 }
    );
  }
}

interface PortfolioParams {
  name: string;
  headline: string;
  bio: string;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    images?: string[];
    skills?: string[];
    toolsUsed?: string[];
  }>;
  profileImage: string | null;
  template: string;
  visualStyle?: {
    theme_color?: string;
    background_gradient_start?: string;
    background_gradient_end?: string;
    font_style?: string;
  };
}

function generatePortfolioHTML(params: PortfolioParams): string {
  const { name, headline, bio, skills, projects, profileImage, template, visualStyle } = params;

  // Default styles
  const themeColor = visualStyle?.theme_color || '#667eea';
  const bgStart = visualStyle?.background_gradient_start || '#1e3a5f';
  const bgEnd = visualStyle?.background_gradient_end || '#0f1c2e';
  const fontStyle = visualStyle?.font_style || 'modern';

  let fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif";
  if (fontStyle === 'classic') fontFamily = "'Georgia', serif";
  if (fontStyle === 'tech') fontFamily = "'Courier New', monospace";
  if (fontStyle === 'playful') fontFamily = "'Comic Sans MS', 'Chalkboard SE', sans-serif";

  const projectsHTML = projects.map((project, index) => {
    const projectImages = (project.images || []).slice(0, 3);
    const imagesHTML = projectImages.length > 0 
      ? `<div class="project-images">
          ${projectImages.map(img => `<img src="${img}" alt="${project.name}" class="project-img" />`).join('')}
         </div>`
      : '';
    
    const toolsHTML = (project.toolsUsed || []).length > 0
      ? `<div class="tools"><span class="tools-label">Tools:</span> ${(project.toolsUsed || []).join(', ')}</div>`
      : '';

    const skillsHTML = (project.skills || []).length > 0
      ? `<div class="project-skills">${(project.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>`
      : '';

    return `
      <div class="project-card">
        <div class="project-number">${String(index + 1).padStart(2, '0')}</div>
        <div class="project-content">
          <h3 class="project-title">${project.name || 'Untitled Project'}</h3>
          <p class="project-desc">${project.description || ''}</p>
          ${toolsHTML}
          ${skillsHTML}
        </div>
        ${imagesHTML}
      </div>
    `;
  }).join('');

  const skillsHTML = skills.length > 0
    ? `<div class="skills-section">
        <h2>Skills</h2>
        <div class="skills-list">
          ${skills.map(s => `<span class="skill-badge">${s}</span>`).join('')}
        </div>
       </div>`
    : '';

  const profileImageHTML = profileImage 
    ? `<img src="${profileImage}" alt="${name}" class="profile-image" />`
    : `<div class="profile-placeholder">${name.charAt(0).toUpperCase()}</div>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${fontFamily};
      background: linear-gradient(135deg, ${bgStart} 0%, ${bgEnd} 100%);
      min-height: 100vh;
      color: #ffffff;
      padding: 60px;
    }
    
    .container {
      max-width: 1080px;
      margin: 0 auto;
    }
    
    /* Header Section */
    .header {
      display: flex;
      align-items: center;
      gap: 40px;
      margin-bottom: 60px;
      padding: 40px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      backdrop-filter: blur(10px);
      border-left: 5px solid ${themeColor};
    }
    
    .profile-image {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid rgba(255, 255, 255, 0.2);
    }
    
    .profile-placeholder {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${themeColor} 0%, ${bgEnd} 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 60px;
      font-weight: bold;
      color: white;
    }
    
    .header-info {
      flex: 1;
    }
    
    .name {
      font-size: 42px;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(90deg, #fff 0%, ${themeColor} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .headline {
      font-size: 22px;
      color: ${themeColor};
      margin-bottom: 16px;
      filter: brightness(1.3);
    }
    
    .bio {
      font-size: 16px;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.8);
    }
    
    /* Skills Section */
    .skills-section {
      margin-bottom: 60px;
    }
    
    .skills-section h2 {
      font-size: 28px;
      margin-bottom: 20px;
      color: #fff;
      border-bottom: 2px solid ${themeColor};
      display: inline-block;
      padding-bottom: 5px;
    }
    
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .skill-badge {
      background: linear-gradient(135deg, ${themeColor} 0%, ${bgEnd} 100%);
      padding: 10px 20px;
      border-radius: 30px;
      font-size: 14px;
      font-weight: 500;
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    /* Projects Section */
    .projects-section h2 {
      font-size: 28px;
      margin-bottom: 30px;
      color: #fff;
      border-bottom: 2px solid ${themeColor};
      display: inline-block;
      padding-bottom: 5px;
    }
    
    .project-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      display: flex;
      gap: 30px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: transform 0.3s ease;
    }
    
    .project-number {
      font-size: 48px;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.05);
      line-height: 1;
      -webkit-text-stroke: 1px ${themeColor};
    }
    
    .project-content {
      flex: 1;
    }
    
    .project-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #fff;
    }
    
    .project-desc {
      font-size: 15px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 16px;
    }
    
    .tools {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 12px;
    }
    
    .tools-label {
      color: ${themeColor};
      font-weight: 500;
      filter: brightness(1.3);
    }
    
    .project-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .skill-tag {
      background: rgba(255, 255, 255, 0.1);
      color: ${themeColor};
      padding: 4px 12px;
      border-radius: 15px;
      font-size: 12px;
      filter: brightness(1.3);
    }
    
    .project-images {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 280px;
    }
    
    .project-img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 12px;
      border: 2px solid rgba(255, 255, 255, 0.1);
    }
    
    /* Footer */
    .footer {
      text-align: center;
      margin-top: 60px;
      padding-top: 40px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.4);
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${profileImageHTML}
      <div class="header-info">
        <h1 class="name">${name}</h1>
        <p class="headline">${headline}</p>
        <p class="bio">${bio}</p>
      </div>
    </div>
    
    ${skillsHTML}
    
    <div class="projects-section">
      <h2>Projects</h2>
      ${projectsHTML}
    </div>
    
    <div class="footer">
      Generated by The Project Hub
    </div>
  </div>
</body>
</html>
  `;
}
