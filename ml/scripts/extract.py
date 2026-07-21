import sys
import json
import spacy

def main():
    # Read text from stdin
    try:
        text = sys.stdin.read().strip()
    except Exception as e:
        sys.stderr.write(f"Error reading stdin: {str(e)}\n")
        sys.exit(1)

    if not text:
        print(json.dumps([]))
        return
        
    try:
        nlp = spacy.load("en_core_web_sm")
        
        # Add entity ruler if not present
        if "entity_ruler" not in nlp.pipe_names:
            ruler = nlp.add_pipe("entity_ruler", before="ner")
            
            # Custom skills patterns mapping
            skills_patterns = [
                # Languages
                {"label": "SKILL", "pattern": [{"LOWER": "python"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "javascript"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "typescript"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "java"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "c++"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "c#"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "go"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "rust"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "ruby"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "php"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "swift"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "kotlin"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "scala"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "html"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "css"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "sql"}]},
                
                # ML / Data Science
                {"label": "SKILL", "pattern": [{"LOWER": "pytorch"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "tensorflow"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "keras"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "pandas"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "numpy"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "scikit-learn"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "scikit"}, {"LOWER": "-"}, {"LOWER": "learn"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "machine"}, {"LOWER": "learning"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "deep"}, {"LOWER": "learning"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "nlp"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "natural"}, {"LOWER": "language"}, {"LOWER": "processing"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "data"}, {"LOWER": "science"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "data"}, {"LOWER": "analysis"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "matplotlib"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "seaborn"}]},
                
                # Frontend Frameworks
                {"label": "SKILL", "pattern": [{"LOWER": "react"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "react.js"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "reactjs"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "angular"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "angularjs"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "vue"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "vue.js"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "vuejs"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "next.js"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "nextjs"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "nuxt.js"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "svelte"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "tailwind"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "bootstrap"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "sass"}]},
                
                # Backend Frameworks / Runtimes
                {"label": "SKILL", "pattern": [{"LOWER": "node.js"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "node"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "express"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "express.js"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "django"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "flask"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "fastapi"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "spring"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "spring"}, {"LOWER": "boot"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "nest.js"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "nestjs"}]},
                
                # Databases
                {"label": "SKILL", "pattern": [{"LOWER": "postgresql"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "postgres"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "mongodb"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "mysql"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "redis"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "sqlite"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "firebase"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "oracle"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "dynamodb"}]},
                
                # Cloud / DevOps
                {"label": "SKILL", "pattern": [{"LOWER": "docker"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "kubernetes"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "aws"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "azure"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "gcp"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "google"}, {"LOWER": "cloud"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "terraform"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "jenkins"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "git"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "github"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "gitlab"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "ansible"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "prometheus"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "grafana"}]},
                
                # Tools & Methodologies
                {"label": "SKILL", "pattern": [{"LOWER": "figma"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "jira"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "agile"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "scrum"}]},
                {"label": "SKILL", "pattern": [{"LOWER": "linux"}]}
            ]
            ruler.add_patterns(skills_patterns)
            
        doc = nlp(text)
        skills = set()
        for ent in doc.ents:
            if ent.label_ == "SKILL":
                # Capitalize first letter of each word for clean formatting
                words = ent.text.split(' ')
                formatted_skill = ' '.join(w.capitalize() if w.lower() not in ['js', 'css', 'nlp', 'aws', 'gcp', 'ci', 'cd', 'ui', 'ux'] else w.upper() for w in words)
                skills.add(formatted_skill)
        
        # Output as JSON list
        print(json.dumps(list(skills)))
    except Exception as e:
        sys.stderr.write(f"Error during extraction: {str(e)}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
