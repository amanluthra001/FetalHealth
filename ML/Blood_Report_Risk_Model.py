#Blood_Report_Risk Model

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# 1. Load the dataset
# Replace 'maternal_health_risk.csv' with your actual file name
df = pd.read_csv('Maternal_Risk.csv')

# 2. Check the first few rows to see the columns
print("--- First 5 Rows ---")
print(df.head())

# 3. Check for missing values (crucial for medical data)
print("\n--- Missing Values ---")
print(df.isnull().sum())

# 4. Check the data types (finding text vs numbers)
print("\n--- Data Types ---")
print(df.info())

# 5. Visualize Correlations
# We drop the 'RiskLevel' column temporarily if it's text (High/Mid/Low) 
# just to see numerical correlations first.
plt.figure(figsize=(10, 8))
sns.heatmap(df.select_dtypes(include=['number']).corr(), annot=True, cmap='coolwarm', fmt=".2f")
plt.title('Correlation Matrix: Blood Factors')
plt.show()




from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# 1. Prepare the Data
# We drop 'RiskLevel' (target). We try to drop 'RiskScore' but ignore errors if it's not there.
X = df.drop(columns=['RiskLevel', 'RiskScore'], errors='ignore') 
y = df['RiskLevel']

# 2. Split into Training and Testing sets (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Initialize the Random Forest Model
model = RandomForestClassifier(n_estimators=100, random_state=42)

# 4. Train the model
print("Training the model... please wait.")
model.fit(X_train, y_train)

# 5. Test the model
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

print(f"\n--- Model Accuracy: {accuracy * 100:.2f}% ---")
print("\n--- Detailed Report ---")
print(classification_report(y_test, predictions))


#Saving the file so that our model does not has to memorise it again and again.
import joblib

# 1. Save the trained model to a file
joblib.dump(model, 'risk_model.pkl')

print("Success! Model saved as 'risk_model.pkl'.")
print("We can now load this file into our backend to make real predictions.")