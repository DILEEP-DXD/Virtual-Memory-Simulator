"""
Report Generator for Virtual Memory Simulation Results

Generates a minimal HTML summary report from batch CSV results.

Usage:
    python report_generator.py --csv results.csv --out report.html
"""

import argparse
import csv
import sys
from datetime import datetime
from pathlib import Path


def load_csv_results(csv_path: str) -> list:
    """Load results from CSV file."""
    results = []
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Convert numeric fields
            row['frames'] = int(row['frames'])
            row['page_faults'] = int(row['page_faults'])
            row['page_ins'] = int(row['page_ins'])
            row['page_outs'] = int(row['page_outs'])
            row['hits'] = int(row['hits'])
            row['hit_ratio'] = float(row['hit_ratio'])
            row['avg_access_time_ms'] = float(row['avg_access_time_ms'])
            row['total_accesses'] = int(row['total_accesses'])
            results.append(row)
    return results


def analyze_results(results: list) -> dict:
    """Analyze results and compute comparisons."""
    if not results:
        return {}
    
    # Group by algorithm
    by_algorithm = {}
    for result in results:
        algo = result['algorithm']
        if algo not in by_algorithm:
            by_algorithm[algo] = []
        by_algorithm[algo].append(result)
    
    # Find best algorithm overall (lowest average page faults)
    algo_avg_faults = {}
    for algo, algo_results in by_algorithm.items():
        avg_faults = sum(r['page_faults'] for r in algo_results) / len(algo_results)
        algo_avg_faults[algo] = avg_faults
    
    best_algo = min(algo_avg_faults.keys(), key=lambda k: algo_avg_faults[k])
    worst_algo = max(algo_avg_faults.keys(), key=lambda k: algo_avg_faults[k])
    
    # Find best configuration
    best_config = min(results, key=lambda r: r['page_faults'])
    worst_config = max(results, key=lambda r: r['page_faults'])
    
    return {
        'by_algorithm': by_algorithm,
        'algo_avg_faults': algo_avg_faults,
        'best_algo': best_algo,
        'worst_algo': worst_algo,
        'best_config': best_config,
        'worst_config': worst_config
    }


def generate_interpretation(analysis: dict, results: list) -> str:
    """Generate human-readable interpretation."""
    if not analysis:
        return "No results to analyze."
    
    best_algo = analysis['best_algo']
    worst_algo = analysis['worst_algo']
    best_config = analysis['best_config']
    worst_config = analysis['worst_config']
    algo_avg_faults = analysis['algo_avg_faults']
    
    interpretation = f"""
<h2>Analysis Summary</h2>

<p>
Across all experiments, <strong>{best_algo}</strong> performed best with an average of 
{algo_avg_faults[best_algo]:.2f} page faults, while <strong>{worst_algo}</strong> had the 
highest average of {algo_avg_faults[worst_algo]:.2f} page faults.
</p>

<p>
The optimal configuration was <strong>{best_config['algorithm']}</strong> with 
<strong>{best_config['frames']} frames</strong>, producing only {best_config['page_faults']} 
page faults (hit ratio: {best_config['hit_ratio']:.2%}).
</p>

<p>
The worst configuration was <strong>{worst_config['algorithm']}</strong> with 
<strong>{worst_config['frames']} frames</strong>, resulting in {worst_config['page_faults']} 
page faults (hit ratio: {worst_config['hit_ratio']:.2%}).
</p>

<h3>Algorithm Comparison</h3>
<p>
"""
    
    # Compare each algorithm
    for algo in sorted(algo_avg_faults.keys()):
        avg_faults = algo_avg_faults[algo]
        interpretation += f"<strong>{algo}</strong>: {avg_faults:.2f} average page faults<br>\n"
    
    interpretation += "</p>"
    
    # Impact of frame count
    interpretation += """
<h3>Impact of Frame Count</h3>
<p>
As expected, increasing the number of physical frames generally reduces page faults 
by allowing more pages to remain in memory simultaneously. However, the relationship 
is not always linear, and some algorithms (particularly FIFO) can exhibit Belady's 
anomaly where more frames occasionally lead to more page faults.
</p>
"""
    
    return interpretation


def generate_html_report(results: list, analysis: dict, output_path: str):
    """Generate HTML report."""
    interpretation = generate_interpretation(analysis, results)
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Virtual Memory Simulation Report</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 40px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #555;
            margin-top: 30px;
        }}
        h3 {{
            color: #666;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        th {{
            background-color: #4CAF50;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }}
        td {{
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }}
        tr:hover {{
            background-color: #f5f5f5;
        }}
        .metric {{
            display: inline-block;
            margin: 10px 20px 10px 0;
            padding: 10px 15px;
            background-color: #e8f5e9;
            border-radius: 4px;
        }}
        .metric-label {{
            font-weight: bold;
            color: #2e7d32;
        }}
        .best {{
            background-color: #c8e6c9;
            font-weight: bold;
        }}
        .worst {{
            background-color: #ffcdd2;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 0.9em;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Virtual Memory Simulation Report</h1>
        <p><em>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</em></p>
        
        {interpretation}
        
        <h2>Detailed Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Frames</th>
                    <th>Algorithm</th>
                    <th>Page Faults</th>
                    <th>Hits</th>
                    <th>Hit Ratio</th>
                    <th>Page-ins</th>
                    <th>Page-outs</th>
                    <th>Avg Access Time (ms)</th>
                </tr>
            </thead>
            <tbody>
"""
    
    # Add table rows
    best_config = analysis.get('best_config')
    worst_config = analysis.get('worst_config')
    
    for result in sorted(results, key=lambda r: (r['frames'], r['algorithm'])):
        row_class = ''
        if best_config and result == best_config:
            row_class = 'best'
        elif worst_config and result == worst_config:
            row_class = 'worst'
        
        html += f"""
                <tr class="{row_class}">
                    <td>{result['frames']}</td>
                    <td>{result['algorithm']}</td>
                    <td>{result['page_faults']}</td>
                    <td>{result['hits']}</td>
                    <td>{result['hit_ratio']:.2%}</td>
                    <td>{result['page_ins']}</td>
                    <td>{result['page_outs']}</td>
                    <td>{result['avg_access_time_ms']:.4f}</td>
                </tr>
"""
    
    html += """
            </tbody>
        </table>
        
        <div class="footer">
            <p>Report generated by Virtual Memory Management Tool</p>
        </div>
    </div>
</body>
</html>
"""
    
    with open(output_path, 'w') as f:
        f.write(html)


def main():
    parser = argparse.ArgumentParser(description='Generate HTML report from simulation results')
    parser.add_argument('--csv', required=True, help='Input CSV file with results')
    parser.add_argument('--out', default='report.html', help='Output HTML file')
    
    args = parser.parse_args()
    
    # Load results
    try:
        results = load_csv_results(args.csv)
    except Exception as e:
        print(f"Error loading CSV: {e}", file=sys.stderr)
        sys.exit(1)
    
    if not results:
        print("No results found in CSV!", file=sys.stderr)
        sys.exit(1)
    
    # Analyze results
    analysis = analyze_results(results)
    
    # Generate report
    try:
        generate_html_report(results, analysis, args.out)
        print(f"Report generated: {args.out}")
    except Exception as e:
        print(f"Error generating report: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
