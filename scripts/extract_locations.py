import json
import re
import os

def parse_location_dat(file_path):
    countries = []
    current_country = None
    
    with open(file_path, 'r', encoding='latin-1') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            
            # Detect country header [Country Name]
            match = re.match(r'\[(.*?)\]', line)
            if match:
                current_country = {
                    "country": match.group(1),
                    "cities": []
                }
                countries.append(current_country)
                continue
            
            if current_country:
                # Parse city line: Name Lat Lon Tz Elev
                # Format is roughly fixed width or multiple spaces
                parts = re.split(r'\s{2,}', line)
                if len(parts) >= 4:
                    name = parts[0]
                    try:
                        lat = float(parts[1])
                        lon = float(parts[2])
                        tz = float(parts[3])
                        elev = float(parts[4]) if len(parts) > 4 else 0.0
                        
                        current_country["cities"].append({
                            "name": name,
                            "lat": lat,
                            "lon": lon,
                            "tz": tz,
                            "elev": elev
                        })
                    except ValueError:
                        continue

    return countries

if __name__ == "__main__":
    src = "/Users/sugengrifqimubaroq/Not Sync icloud/Github/Aplikasi hisab/Al Falak DPUA-tauri/AlFalak-DPUA-vb6/location.dat"
    dest = "/Users/sugengrifqimubaroq/Not Sync icloud/Github/Aplikasi hisab/Al Falak DPUA-tauri/hisab-hilal-tauri/src/assets/locations.json"
    
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    
    data = parse_location_dat(src)
    with open(dest, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Successfully extracted {len(data)} countries to {dest}")
