document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate');
    calculateBtn.addEventListener('click', calculateInvestment);

    // Initialize calculation on page load
    calculateInvestment();
});

function calculateInvestment() {
    // Get input values - User investment choices
    const initialPrice = parseFloat(document.getElementById('initialPrice').value);
    const marketPrice = parseFloat(document.getElementById('marketPrice').value);
    const annualPriceChange = parseFloat(document.getElementById('annualPriceChange').value) / 100;
    const futureDiscount = parseFloat(document.getElementById('futureDiscount').value) / 100;
    const annualInvestment = parseFloat(document.getElementById('annualInvestment').value);
    const dividend = parseFloat(document.getElementById('dividend').value);
    const duration = parseInt(document.getElementById('duration').value);
    
    // Get input values - Tax parameters
    const capitalGainsTax = parseFloat(document.getElementById('capitalGainsTax').value) / 100;
    const healthInsuranceRate = parseFloat(document.getElementById('healthInsuranceRate').value) / 100;
    const minWage = parseFloat(document.getElementById('minWage').value);
    const eurToLei = parseFloat(document.getElementById('eurToLei').value);
    
    // Calculate investment over time
    const results = calculateInvestmentGrowth(
        initialPrice,
        marketPrice,
        annualPriceChange,
        futureDiscount,
        annualInvestment,
        dividend,
        duration,
        capitalGainsTax,
        healthInsuranceRate,
        minWage,
        eurToLei
    );
    
    // Update chart
    updateChart(results);
    
    // Update summary results
    displaySummary(results);
    
    // Update yearly breakdown
    displayYearlyBreakdown(results);
}

function calculateInvestmentGrowth(
    initialPrice,
    marketPrice,
    annualPriceChange,
    futureDiscount,
    annualInvestment,
    dividend,
    duration,
    capitalGainsTax,
    healthInsuranceRate,
    minWage,
    eurToLei
) {
    const results = [];
    
    // Track running totals
    let currentShares = 0;
    let totalInvestment = 0;
    let currentMarketPrice = marketPrice; // Current market price that will change over time
    let totalDividends = 0;
    
    // Calculate for each year (starting from year 1)
    for (let year = 1; year <= duration; year++) {
        // First, make the investment at the beginning of the year
        // For year 1, use initialPrice, for subsequent years use discounted current market price
        const purchasePrice = (year === 1) ? initialPrice : currentMarketPrice * (1 - futureDiscount);
        
        // Shares bought with annual investment
        const sharesFromAnnualInvestment = annualInvestment / purchasePrice;
        
        // Add new shares from investment
        currentShares += sharesFromAnnualInvestment;
        
        // Add investment amount
        totalInvestment += annualInvestment;
        
        // Update market price based on annual growth/decline (for end of year)
        currentMarketPrice = currentMarketPrice * (1 + annualPriceChange);
        
        // Now calculate dividends at the end of the year based on shares owned
        const dividendsThisYear = currentShares * dividend;
        totalDividends += dividendsThisYear;
        
        // Reinvest dividends at the end of year price with discount
        const endOfYearDiscountedPrice = currentMarketPrice * (1 - futureDiscount);
        const sharesFromDividends = dividendsThisYear / endOfYearDiscountedPrice;
        
        // Add shares from dividend reinvestment
        currentShares += sharesFromDividends;
        
        // Calculate total shares added this year
        const sharesThisYear = sharesFromAnnualInvestment + sharesFromDividends;
        
        // Calculate market value at the end of the year (using updated market price)
        const marketValue = currentShares * currentMarketPrice;
        
        // Calculate unrealized gain
        const unrealizedGain = marketValue - totalInvestment;
        
        // Calculate capital gains tax on dividends only
        const capitalGainsTaxAmount = dividendsThisYear * capitalGainsTax;
        
        // Calculate health insurance tax (based on dividend income in Lei)
        const dividendsInLei = dividendsThisYear * eurToLei;
        let healthInsuranceTax = 0;
        
        // Convert thresholds to Lei
        const threshold1 = 6 * minWage;  // 6 minimum wages
        const threshold2 = 12 * minWage; // 12 minimum wages
        const threshold3 = 24 * minWage; // 24 minimum wages
        
        if (dividendsInLei >= threshold1 && dividendsInLei < threshold2) {
            healthInsuranceTax = threshold1 * healthInsuranceRate;
        } else if (dividendsInLei >= threshold2 && dividendsInLei < threshold3) {
            healthInsuranceTax = threshold2 * healthInsuranceRate;
        } else if (dividendsInLei >= threshold3) {
            healthInsuranceTax = threshold3 * healthInsuranceRate;
        }
        
        // Convert health insurance tax back to EUR
        healthInsuranceTax = healthInsuranceTax / eurToLei;
        
        // Calculate total tax (only on dividends during investment period)
        const totalTax = capitalGainsTaxAmount + healthInsuranceTax;
        
        // Calculate net gain (unrealized gain - tax paid so far)
        // Note: This doesn't include the tax on the final sale which is calculated in the summary
        const netGain = unrealizedGain - totalTax;
        
        // Add results for this year - represents end-of-year state
        results.push({
            year: year,
            investmentThisYear: annualInvestment,
            sharesFromInvestment: sharesFromAnnualInvestment,
            sharesFromDividends: sharesFromDividends,
            sharesThisYear: sharesThisYear,
            totalShares: currentShares,
            totalInvestment: totalInvestment,
            marketPrice: currentMarketPrice,
            marketValue: marketValue,
            unrealizedGain: unrealizedGain,
            dividendsThisYear: dividendsThisYear,
            totalDividends: totalDividends,
            capitalGainsTax: capitalGainsTaxAmount,
            healthInsuranceTax: healthInsuranceTax,
            totalTax: totalTax,
            netGain: netGain
        });
    }
    
    return results;
}

// Chart instance
let investmentChart = null;

function updateChart(results) {
    const ctx = document.getElementById('investmentChart').getContext('2d');
    
    // Extract data for chart
    const labels = results.map(result => `Year ${result.year}`);
    const marketValueData = results.map(result => result.marketValue);
    const totalInvestmentData = results.map(result => result.totalInvestment);
    const netGainData = results.map(result => result.netGain);
    const capitalGainsTaxData = results.map(result => result.capitalGainsTax);
    const healthInsuranceTaxData = results.map(result => result.healthInsuranceTax);
    
    // Destroy previous chart if it exists
    if (investmentChart) {
        investmentChart.destroy();
    }
    
    // Create new chart
    investmentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Market Value (€)',
                    data: marketValueData,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Total Investment (€)',
                    data: totalInvestmentData,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Net Gain (€)',
                    data: netGainData,
                    backgroundColor: 'rgba(153, 102, 255, 0.7)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Capital Gains Tax (€)',
                    data: capitalGainsTaxData,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Health Insurance (CASS) (€)',
                    data: healthInsuranceTaxData,
                    backgroundColor: 'rgba(255, 159, 64, 0.7)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (€)'
                    }
                }
            }
        }
    });
}

function displaySummary(results) {
    const finalResult = results[results.length - 1];
    const summaryResults = document.getElementById('summaryResults');
    
    // Calculate tax on final sale (capital gains tax on the unrealized gain when selling)
    const capitalGainsTaxRate = parseFloat(document.getElementById('capitalGainsTax').value) / 100;
    const finalSaleGain = finalResult.marketValue - finalResult.totalInvestment;
    const finalSaleTax = finalSaleGain > 0 ? finalSaleGain * capitalGainsTaxRate : 0;
    
    // Calculate total tax (accumulated tax + final sale tax)
    const totalTaxWithSale = finalResult.totalTax + finalSaleTax;
    
    // Calculate net gain after all taxes
    const netGainAfterSale = finalResult.netGain - finalSaleTax;
    
    // Calculate ROI after all taxes
    const roiAfterSale = ((netGainAfterSale / finalResult.totalInvestment) * 100).toFixed(2);
    
    // Calculate annualized ROI (CAGR - Compound Annual Growth Rate) after all taxes
    const annualROIAfterSale = finalResult.year > 0 ? 
        (Math.pow((1 + netGainAfterSale / finalResult.totalInvestment), 1 / finalResult.year) - 1) * 100 : 
        0; // Avoid division by zero for year 0
    
    summaryResults.innerHTML = `
        <table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Total Investment</td>
                <td>${formatCurrency(finalResult.totalInvestment)}</td>
            </tr>
            <tr>
                <td>Final Market Value</td>
                <td>${formatCurrency(finalResult.marketValue)}</td>
            </tr>
            <tr>
                <td>Total Shares</td>
                <td>${finalResult.totalShares.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Total Dividends</td>
                <td>${formatCurrency(finalResult.totalDividends)}</td>
            </tr>
            <tr>
                <td>Tax on Dividends</td>
                <td>${formatCurrency(finalResult.totalTax)}</td>
            </tr>
            <tr>
                <td>Estimated Tax on Final Sale</td>
                <td>${formatCurrency(finalSaleTax)}</td>
            </tr>
            <tr>
                <td>Total Tax (Dividends + Final Sale)</td>
                <td>${formatCurrency(totalTaxWithSale)}</td>
            </tr>
            <tr>
                <td>Net Gain After All Taxes</td>
                <td>${formatCurrency(netGainAfterSale)}</td>
            </tr>
            <tr>
                <td>Return on Investment (ROI) After All Taxes</td>
                <td>${roiAfterSale}%</td>
            </tr>
            <tr>
                <td>Annual ROI After All Taxes</td>
                <td>${annualROIAfterSale.toFixed(2)}%</td>
            </tr>
        </table>
        <div class="term-explanations">
            <p><strong>Total Investment:</strong> Total amount invested over time (annual investments × years).</p>
            <p><strong>Final Market Value:</strong> Value of all shares at the end of the investment period based on market price.</p>
            <p><strong>Tax on Dividends:</strong> Accumulated tax paid on dividends during the investment period.</p>
            <p><strong>Estimated Tax on Final Sale:</strong> Tax that would be due when selling all shares at the end (10% of capital gains).</p>
            <p><strong>Net Gain After All Taxes:</strong> Total profit after accounting for all taxes (dividends and final sale).</p>
            <p><strong>Annual ROI:</strong> Annualized rate of return, showing the effective yearly growth rate of your investment.</p>
            <p><em>Note: Each year shows values at the end of that year, after the annual investment, dividend distribution, and price changes have been applied.</em></p>
        </div>
    `;
}

function displayYearlyBreakdown(results) {
    const yearlyBreakdown = document.getElementById('yearlyBreakdown');
    
    let tableHTML = `
        <table>
            <tr>
                <th>Year</th>
                <th>Invest. (€)</th>
                <th>Shares<br>from Invest.</th>
                <th>Shares<br>from Div.</th>
                <th>Total<br>Shares Add.</th>
                <th>Total<br>Shares</th>
                <th>Stock<br>Price (€)</th>
                <th>Market<br>Value (€)</th>
                <th>Div. (€)</th>
                <th>Div.<br>Tax (€)</th>
                <th>Health<br>Ins. (€)</th>
                <th>Unrealized<br>Gain (€)</th>
            </tr>
    `;
    
    results.forEach(result => {
        tableHTML += `
            <tr>
                <td>${result.year}</td>
                <td>${formatCurrency(result.investmentThisYear)}</td>
                <td>${result.sharesFromInvestment ? result.sharesFromInvestment.toFixed(2) : '0.00'}</td>
                <td>${result.sharesFromDividends ? result.sharesFromDividends.toFixed(2) : '0.00'}</td>
                <td>${result.sharesThisYear.toFixed(2)}</td>
                <td>${result.totalShares.toFixed(2)}</td>
                <td>${formatCurrency(result.marketPrice)}</td>
                <td>${formatCurrency(result.marketValue)}</td>
                <td>${formatCurrency(result.dividendsThisYear)}</td>
                <td>${formatCurrency(result.capitalGainsTax)}</td>
                <td>${formatCurrency(result.healthInsuranceTax)}</td>
                <td>${formatCurrency(result.netGain)}</td>
            </tr>
        `;
    });
    
    tableHTML += `</table>
    <div class="term-explanations">
        <p><strong>Year X:</strong> Values at the end of year X, after the investment, dividend payout, and price change for that year.</p>
        <p><strong>Shares from Invest.:</strong> Number of shares purchased with the annual investment made at the beginning of the year.</p>
        <p><strong>Shares from Div.:</strong> Additional shares purchased by reinvesting dividends received at the end of that year.</p>
        <p><strong>Div. Tax:</strong> Tax paid on dividends in that year (10% of dividend income).</p>
        <p><strong>Health Ins.:</strong> Health insurance contribution (CASS) calculated based on Romanian threshold system.</p>
        <p><strong>Unrealized Gain:</strong> Potential profit if shares were sold at that point, after accounting for taxes paid.</p>
    </div>`;
    yearlyBreakdown.innerHTML = tableHTML;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}