import fs from "fs/promises";
import os from "os";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import WordExtractor from "word-extractor";
import type { IParsedResumeData } from "@linkai/types";

class ResumeParserService {
  async parseFile(filePath: string, mimeType: string): Promise<IParsedResumeData> {
    const buffer = await fs.readFile(filePath);
    const rawText = await this.extractText(buffer, mimeType, filePath);
    return this.structureParsedData(rawText);
  }

  private async extractText(buffer: Buffer, mimeType: string, filePath: string): Promise<string> {
    if (mimeType === "application/pdf") {
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    if (mimeType === "application/msword") {
      const extractor = new WordExtractor();
      const doc = await extractor.extract(filePath);
      return doc.getBody();
    }

    return "";
  }

  private structureParsedData(rawText: string): IParsedResumeData {
    const cleaned = rawText.replace(/\r\n/g, "\n").trim();
    const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

    const emailMatch = cleaned.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = cleaned.match(/(\+?\d[\d\s().-]{7,}\d)/);

    const skills = this.extractSectionItems(cleaned, ["skills", "technical skills", "core competencies"]);
    const experience = this.extractExperience(cleaned);
    const education = this.extractEducation(cleaned);
    const certifications = this.extractSectionItems(cleaned, ["certifications", "licenses"]);
    const projects = this.extractProjects(cleaned);

    const name = lines[0] && !emailMatch?.[0]?.includes(lines[0]) ? lines[0] : undefined;
    const summary = this.extractSection(cleaned, ["summary", "professional summary", "profile"]);

    return {
      name,
      email: emailMatch?.[0],
      phone: phoneMatch?.[0],
      skills,
      experience,
      education,
      projects,
      certifications,
      summary,
      rawText: cleaned.slice(0, 50000),
    };
  }

  private extractSection(text: string, headers: string[]): string | undefined {
    const pattern = new RegExp(
      `(?:${headers.join("|")})[:\\s]*\\n([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s]{2,}|$)`,
      "i"
    );
    const match = text.match(pattern);
    return match?.[1]?.trim().slice(0, 1500);
  }

  private extractSectionItems(text: string, headers: string[]): string[] {
    const section = this.extractSection(text, headers);
    if (!section) return [];
    return section
      .split(/[,•\n|]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 80)
      .slice(0, 30);
  }

  private extractExperience(text: string): IParsedResumeData["experience"] {
    const section = this.extractSection(text, ["experience", "work experience", "employment"]);
    if (!section) return [];

    const blocks = section.split(/\n{2,}/).slice(0, 10);
    return blocks.map((block) => {
      const blockLines = block.split("\n").filter(Boolean);
      return {
        title: blockLines[0],
        company: blockLines[1],
        duration: blockLines.find((l) => /\d{4}/.test(l)),
        description: blockLines.slice(2).join(" ").slice(0, 500),
      };
    });
  }

  private extractEducation(text: string): IParsedResumeData["education"] {
    const section = this.extractSection(text, ["education", "academic"]);
    if (!section) return [];

    return section.split(/\n{2,}/).slice(0, 8).map((block) => {
      const blockLines = block.split("\n").filter(Boolean);
      return {
        degree: blockLines[0],
        institution: blockLines[1],
        year: blockLines.find((l) => /\d{4}/.test(l)),
      };
    });
  }

  private extractProjects(text: string): IParsedResumeData["projects"] {
    const section = this.extractSection(text, ["projects", "personal projects"]);
    if (!section) return [];

    return section.split(/\n{2,}/).slice(0, 8).map((block) => {
      const blockLines = block.split("\n").filter(Boolean);
      return {
        name: blockLines[0],
        description: blockLines.slice(1).join(" ").slice(0, 400),
      };
    });
  }
}

export const resumeParserService = new ResumeParserService();
