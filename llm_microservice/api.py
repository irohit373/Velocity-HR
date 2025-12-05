from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional
from pypdf import PdfReader
import openai
import requests
import json
import os
import io

load_dotenv()

app = FastAPI(title="Velocity-H Backend API")

# Get allowed origins from environment variable or use defaults
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://velocity-h.vercel.app")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

# Add Vercel preview URLs support
allowed_origins.append("https://*.vercel.app")

# CORS Configuration for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Models
class ResumeEvaluationResponse(BaseModel):
    jd_match: str
    missing_keywords: list[str]
    profile_summary: str
    prompt_used: str

class ErrorResponse(BaseModel):
    error: str
    prompt_used: str
    details: Optional[str] = None

class JobSummaryRequest(BaseModel):
    job_title: str
    job_description: str
    required_experience_years: int
    tags: list[str]

class JobSummaryResponse(BaseModel):
    summary: str

class ResumeAnalysisRequest(BaseModel):
    resume_url: str
    job_description: str
    cover_letter: Optional[str] = None

class ResumeAnalysisResponse(BaseModel):
    score: float
    summary: str
    missing_keywords: list[str]
    jd_match: str  # Percentage as string (e.g., "85%")

# Helper Functions
def get_response(client, input_prompt, model_name="meta-llama/llama-3.3-70b-instruct:free"):
    """
    Sends the prompt to OpenRouter and returns the text response.
    """
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful ATS assistant."},
                {"role": "user", "content": input_prompt}
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenRouter API error: {str(e)}")

def extract_pdf_text(file_bytes):
    """
    Extracts text from PDF file bytes.
    """
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF extraction error: {str(e)}")

# Prompt Template
input_prompt_template = """
Act as a skilled and very experienced Application Tracking System (ATS) with a deep understanding of 
tech field, engineering, marketing, sales, finance. 
Your task is to evaluate the resume based on the given job description. 
You must consider the job market is very competitive and you should provide 
best assistance for improving the resumes.

resume: {text}
description: {jd}
cover letter or additional details from applicant: {cl}

I want the response in a single string having the structure:
{{"JD Match": "%", "MissingKeywords": [], "Profile Summary": ""}}
"""

job_summary_prompt_template = """
You are an expert HR assistant. Create a comprehensive, structured job summary that will be used by an ATS (Applicant Tracking System) to evaluate candidate resumes.

The summary should be optimized for AI analysis and include:
1. Core role description and primary responsibilities
2. Key technical skills and technologies required (list explicitly)
3. Required experience level and domain expertise
4. Important qualifications, certifications, or educational requirements
5. Critical soft skills or cultural fit indicators

Job Title: {job_title}
Job Description: {job_description}
Required Experience: {required_experience_years} years
Key Skills/Tags: {tags}

Generate a well-structured summary (4-8 sentences) that highlights all essential requirements and qualifications.
Make it detailed enough for AI systems to accurately match and score candidate resumes.
Use clear, specific language that can be easily parsed for keyword matching.
"""

resume_analysis_prompt_template = """
You are an expert ATS (Applicant Tracking System) evaluator. Analyze the resume against the job description and provide:
1. A match score (0-100) indicating how well the candidate fits the role
2. A percentage match as string (e.g., "85%")
3. A list of missing keywords from the job description that are not in the resume
4. A brief analysis summary (2-3 sentences) highlighting strengths and gaps

Job Description: {job_description}
Resume Text: {resume_text}
Cover Letter: {cover_letter}

Respond in JSON format:
{{"score": <number 0-100>, "jd_match": "XX%", "missing_keywords": ["keyword1", "keyword2"], "summary": "<brief analysis>"}}
"""

# API Endpoints
@app.get("/")
async def root():
    return {
        "message": "Velocity H Endpoint API",
        "version": "1.0.0",
        "endpoints": {
            "/evaluate": "POST - Evaluate resume against job description",
            "/health": "GET - Health check",
            "/test-ai": "GET - Test AI model connectivity and functionality"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/test-ai")
async def test_ai():
    """
    Test endpoint to verify AI model is working correctly.
    Sends a simple prompt and returns the response.
    """
    try:
        # Check API key
        api_key = os.getenv("OPENROUTER_API_KEY", '')
        if not api_key:
            return {
                "status": "error",
                "message": "OPENROUTER_API_KEY not configured",
                "model": None,
                "response": None
            }
        
        print("🧪 Testing AI connection...")
        
        # Initialize OpenRouter client
        client = openai.OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        
        # Test prompt
        test_prompt = "Say 'Hello! I am working correctly.' in a friendly way."
        model = "meta-llama/llama-3.3-70b-instruct:free"
        
        print(f"🤖 Testing model: {model}")
        
        # Get AI response
        response_text = get_response(client, test_prompt, model)
        
        print(f"✓ AI test successful - Response length: {len(response_text)} chars")
        
        return {
            "status": "success",
            "message": "AI is working correctly",
            "model": model,
            "test_prompt": test_prompt,
            "response": response_text,
            "response_length": len(response_text)
        }
        
    except HTTPException as e:
        print(f"❌ AI test failed (HTTP): {e.detail}")
        return {
            "status": "error",
            "message": f"AI test failed: {e.detail}",
            "model": model,
            "response": None
        }
    except Exception as e:
        print(f"❌ AI test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Unexpected error: {str(e)}",
            "model": model if 'model' in locals() else None,
            "response": None,
            "error_type": type(e).__name__
        }

@app.post("/api/generate-job-summary", response_model=JobSummaryResponse)
async def generate_job_summary(request: JobSummaryRequest):
    """
    Generate an AI-powered, ATS-optimized summary for a job posting.
    
    - **job_title**: The job title
    - **job_description**: Full job description
    - **required_experience_years**: Years of experience required
    - **tags**: List of relevant skills/technologies
    
    Returns a comprehensive, structured summary optimized for AI-based resume evaluation.
    The summary includes core responsibilities, required skills, experience level, 
    qualifications, and key competencies in a format easily parseable by ATS systems.
    """
    try:
        print(f"📝 Generating job summary for: {request.job_title}")
        
        # Validate input
        if not request.job_title.strip():
            raise HTTPException(status_code=400, detail="Job title cannot be empty")
        if not request.job_description.strip():
            raise HTTPException(status_code=400, detail="Job description cannot be empty")
        
        # Check API key
        api_key = os.getenv("OPENROUTER_API_KEY", '')
        if not api_key:
            print("❌ OPENROUTER_API_KEY not found in environment")
            raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not configured")
        
        print(f"✓ API key found (length: {len(api_key)})")
        
        # Initialize OpenRouter client
        client = openai.OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        
        # Format tags for better readability
        tags_formatted = ", ".join(request.tags) if request.tags else "Not specified"
        
        print(f"✓ Job details - Experience: {request.required_experience_years} years, Tags: {len(request.tags) if request.tags else 0}")
        
        # Format prompt with all job details
        final_prompt = job_summary_prompt_template.format(
            job_title=request.job_title,
            job_description=request.job_description,
            required_experience_years=request.required_experience_years,
            tags=tags_formatted
        )
        
        print(f"🤖 Sending to AI (prompt length: {len(final_prompt)} chars)...")
        
        # Get AI response - using Meta Llama 3.3 70B free model
        model = "meta-llama/llama-3.3-70b-instruct:free"
        response_text = get_response(client, final_prompt, model)
        
        print(f"✓ AI responded (response length: {len(response_text)} chars)")
        
        # Clean and validate response
        summary = response_text.strip()
        
        if not summary:
            print("❌ AI returned empty summary")
            raise HTTPException(status_code=500, detail="AI generated empty summary")
        
        # Log successful generation for monitoring
        print(f"✓ Generated summary for job: {request.job_title}")
        
        return JobSummaryResponse(summary=summary)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating job summary: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Summary generation error: {str(e)}")

@app.post("/api/analyze-resume", response_model=ResumeAnalysisResponse)
async def analyze_resume(request: ResumeAnalysisRequest):
    """
    Analyze a resume against a job description using AI-powered ATS evaluation.
    
    - **resume_url**: URL of the resume PDF file (must be publicly accessible)
    - **job_description**: The job description or AI-generated summary to match against
    - **cover_letter**: Optional cover letter or additional details from applicant
    
    Returns:
    - **score**: Match score (0-100) indicating candidate fit
    - **jd_match**: Percentage match as string (e.g., "85%")
    - **missing_keywords**: List of required skills/keywords not found in resume
    - **summary**: Brief analysis highlighting strengths and gaps
    """
    try:
        # Validate inputs
        if not request.resume_url.strip():
            raise HTTPException(status_code=400, detail="Resume URL cannot be empty")
        if not request.job_description.strip():
            raise HTTPException(status_code=400, detail="Job description cannot be empty")
        
        # Validate URL format
        if not request.resume_url.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail="Invalid resume URL format")
        
        print(f"📄 Analyzing resume from: {request.resume_url[:50]}...")
        
        # Download resume from URL with error handling
        try:
            resume_response = requests.get(
                request.resume_url, 
                timeout=15,
                headers={'User-Agent': 'Mozilla/5.0'}  # Some CDNs require user agent
            )
            resume_response.raise_for_status()
        except requests.Timeout:
            raise HTTPException(status_code=408, detail="Resume download timeout - file may be too large or server slow")
        except requests.RequestException as e:
            raise HTTPException(status_code=400, detail=f"Could not download resume: {str(e)}")
        
        # Validate content type
        content_type = resume_response.headers.get('content-type', '')
        if 'pdf' not in content_type.lower() and not request.resume_url.lower().endswith('.pdf'):
            print(f"⚠️  Warning: Content-Type is '{content_type}', proceeding anyway")
        
        # Extract text from PDF
        resume_text = extract_pdf_text(resume_response.content)
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from resume PDF - file may be empty or corrupted")
        
        print(f"✓ Extracted {len(resume_text)} characters from resume")
        
        # Initialize OpenRouter client
        api_key = os.getenv("OPENROUTER_API_KEY", '')
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not configured")
        
        client = openai.OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        
        # # Prepare resume text with smart truncation
        # max_resume_chars = 3500
        # if len(resume_text) > max_resume_chars:
        #     # Keep beginning and end, truncate middle
        #     truncated_text = resume_text[:max_resume_chars]
        #     print(f"⚠️  Resume truncated from {len(resume_text)} to {max_resume_chars} chars")
        # else:
        #     truncated_text = resume_text
        
        # Format cover letter
        cover_letter_text = request.cover_letter.strip() if request.cover_letter else "Not provided"
        
        # Format prompt with all data
        final_prompt = resume_analysis_prompt_template.format(
            job_description=request.job_description[:2000],  # Limit JD length too
            resume_text=resume_text,
            cover_letter=cover_letter_text[:1000]  # Limit cover letter
        )
        
        print("🤖 Sending to AI for analysis...")
        
        # Get AI response - using Meta Llama 3.3 70B free model
        model = "meta-llama/llama-3.3-70b-instruct:free"
        response_text = get_response(client, final_prompt, model)
        
        # Parse JSON response with better error handling
        try:
            clean_json = response_text.replace("```json", "").replace("```", "").strip()
            # Remove any markdown formatting
            if clean_json.startswith('```'):
                clean_json = '\n'.join(clean_json.split('\n')[1:-1])
            
            data = json.loads(clean_json)
        except json.JSONDecodeError as e:
            print(f"❌ JSON Parse Error: {str(e)}")
            print(f"Raw AI Response: {response_text[:500]}")
            raise HTTPException(
                status_code=500,
                detail=f"AI response was not valid JSON. Error: {str(e)}"
            )
        
        # Validate and extract data with defaults
        score = float(data.get("score", 0))
        jd_match = data.get("jd_match", f"{int(score)}%")
        missing_keywords = data.get("missing_keywords", [])
        summary = data.get("summary", "Analysis completed successfully")
        
        # Validate score range
        if not 0 <= score <= 100:
            print(f"⚠️  AI returned invalid score: {score}, clamping to 0-100")
            score = max(0, min(100, score))
        
        print(f"✓ Analysis complete - Score: {score}/100, Missing keywords: {len(missing_keywords)}")
        
        return ResumeAnalysisResponse(
            score=score,
            jd_match=jd_match,
            missing_keywords=missing_keywords if isinstance(missing_keywords, list) else [],
            summary=summary
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Resume analysis error: {str(e)}")

@app.post("/evaluate", response_model=ResumeEvaluationResponse)
async def evaluate_resume(
    resume: UploadFile = File(..., description="Resume PDF file"),
    job_description: str = Form(..., description="Job description text"),
):
    """
    Evaluate a resume against a job description using AI.
    
    - **resume**: PDF file of the resume
    - **job_description**: The job description text
      
    Returns the match percentage, missing keywords, and profile summary.
    """
    
    # Validate file type
    if not resume.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Validate inputs
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty")
    
    try:
        # Read PDF content
        pdf_bytes = await resume.read()
        resume_text = extract_pdf_text(pdf_bytes)
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        # Initialize OpenRouter client
        client = openai.OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key= os.getenv("OPENROUTER_API_KEY", ''),
        )
        
        # MODEL - using Meta Llama 3.3 70B free model
        model = "meta-llama/llama-3.3-70b-instruct:free"

        # Format prompt
        final_prompt = input_prompt_template.format(text=resume_text, jd=job_description)
        
        # Get AI response
        response_text = get_response(client, final_prompt, model)
        
        # Parse JSON response
        clean_json = response_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)
        
        return ResumeEvaluationResponse(
            jd_match=data.get("JD Match", "N/A"),
            missing_keywords=data.get("MissingKeywords", []),
            profile_summary=data.get("Profile Summary", ""),
            prompt_used=final_prompt
        )
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI response was not valid JSON. Raw response: {response_text[:500]}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
