import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import os

# 1. Define PyTorch Model
class FitClassifier(nn.Module):
    def __init__(self):
        super(FitClassifier, self).__init__()
        self.fc1 = nn.Linear(3, 8)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(8, 3)
        
    def forward(self, x):
        out = self.fc1(x)
        out = self.relu(out)
        out = self.fc2(out)
        return out

# 2. Generate Synthetic Training Data
# Features: [match_percentage, matched_count, missing_count]
# Targets: 0 (Not Yet), 1 (Almost There), 2 (Qualified)
np.random.seed(42)
num_samples = 2000

# Random percentages
match_percentages = np.random.uniform(0.0, 100.0, num_samples)
# Random JD skills count from 3 to 15
jd_counts = np.random.randint(3, 16, num_samples)
# Matched counts based on percentage
matched_counts = np.round((match_percentages / 100.0) * jd_counts).astype(int)
# Missing counts based on difference
missing_counts = jd_counts - matched_counts

X_data = np.stack([match_percentages, matched_counts.astype(float), missing_counts.astype(float)], axis=1)

# Labels based on percentages
y_data = np.zeros(num_samples, dtype=int)
for i, pct in enumerate(match_percentages):
    if pct >= 75.0:
        y_data[i] = 2  # Qualified
    elif pct >= 40.0:
        y_data[i] = 1  # Almost There
    else:
        y_data[i] = 0  # Not Yet

# Convert to PyTorch tensors
X_tensor = torch.tensor(X_data, dtype=torch.float32)
y_tensor = torch.tensor(y_data, dtype=torch.long)

# 3. Train Model
model = FitClassifier()
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.01)

epochs = 100
batch_size = 32

for epoch in range(epochs):
    # Basic batch training loop
    permutation = torch.randperm(X_tensor.size()[0])
    for i in range(0, X_tensor.size()[0], batch_size):
        optimizer.zero_grad()
        indices = permutation[i:i+batch_size]
        batch_x, batch_y = X_tensor[indices], y_tensor[indices]
        
        outputs = model(batch_x)
        loss = criterion(outputs, batch_y)
        loss.backward()
        optimizer.step()

# Validate accuracy
model.eval()
with torch.no_grad():
    predictions = model(X_tensor)
    _, predicted_classes = torch.max(predictions, 1)
    accuracy = (predicted_classes == y_tensor).sum().item() / num_samples
    print(f"Model Training complete. Training Accuracy: {accuracy * 100:.2f}%")

# 4. Export to ONNX
os.makedirs("ml/models", exist_ok=True)
onnx_path = "ml/models/fit_classifier.onnx"

# Dummy input representing one sample: [percentage, matched_count, missing_count]
dummy_input = torch.tensor([[50.0, 5.0, 5.0]], dtype=torch.float32)

# Export the model
torch.onnx.export(
    model,
    dummy_input,
    onnx_path,
    export_params=True,
    opset_version=11,
    do_constant_folding=True,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
)

print(f"SUCCESS: Exported ONNX model to {onnx_path}")
