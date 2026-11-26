-- Project 3.2 - Reporting queries for sales.db
-- Run each query with: sqlite3 sales.db < queries.sql
-- (or paste one query at a time; the Python verifier runs Q1-Q4 automatically)

-- Q1: total revenue and rows for the whole month
SELECT COUNT(*) AS rows, ROUND(SUM(revenue), 2) AS total_revenue
FROM sales;

-- Q2: revenue by region, largest first
SELECT region, ROUND(SUM(revenue), 2) AS revenue
FROM sales
GROUP BY region
ORDER BY revenue DESC;

-- Q3: best-selling products by units
SELECT product, SUM(units) AS units_sold
FROM sales
GROUP BY product
ORDER BY units_sold DESC
LIMIT 3;

-- Q4: channel mix (share of revenue in percent)
SELECT channel,
       ROUND(SUM(revenue), 2) AS revenue,
       ROUND(100.0 * SUM(revenue) / (SELECT SUM(revenue) FROM sales), 1) AS share_pct
FROM sales
GROUP BY channel
ORDER BY revenue DESC;

-- Q5: average discount on discounted rows only
SELECT ROUND(AVG(discount_pct), 1) AS avg_discount
FROM sales
WHERE discount_pct > 0;

-- Q6: revenue from full-price rows versus discounted rows
SELECT CASE WHEN discount_pct = 0 THEN 'full price'
            ELSE 'discounted' END AS price_type,
       ROUND(SUM(revenue), 2) AS revenue
FROM sales
GROUP BY price_type;

-- Q7: revenue by week (SQLite week-of-year)
SELECT strftime('%Y-W%W', date) AS week, ROUND(SUM(revenue), 2) AS revenue
FROM sales
GROUP BY week
ORDER BY week;

-- Q8: the single best sales day
SELECT date, ROUND(SUM(revenue), 2) AS revenue
FROM sales
GROUP BY date
ORDER BY revenue DESC
LIMIT 1;
