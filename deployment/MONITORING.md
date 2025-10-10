# 📊 Monitoring & Logging Setup

## AWS CloudWatch Integration for TransLang

Monitor your deployed application's health, performance, and errors.

---

## 🎯 What to Monitor

### 1. **Application Logs**
- Container stdout/stderr
- Application errors
- Translation requests
- API calls

### 2. **Performance Metrics**
- Response times
- Translation latency
- CPU usage
- Memory usage

### 3. **Health**
- Container health status
- Service availability
- Task restarts
- Failed deployments

---

## 📝 CloudWatch Logs

### View Logs (AWS Console):

1. Go to [CloudWatch Console](https://console.aws.amazon.com/cloudwatch)
2. Click **Logs** → **Log groups**
3. Find `/ecs/translang`
4. Click to view log streams
5. Click a stream to view logs

### View Logs (CLI):

```bash
# Real-time logs (like tail -f)
aws logs tail /ecs/translang --follow

# Recent logs (last 1 hour)
aws logs tail /ecs/translang --since 1h

# Filter logs
aws logs tail /ecs/translang --filter-pattern "ERROR"

# Specific time range
aws logs tail /ecs/translang --since 2025-10-08T10:00:00 --until 2025-10-08T11:00:00
```

### Useful Log Queries:

```bash
# Find errors
aws logs filter-log-events \
  --log-group-name /ecs/translang \
  --filter-pattern "ERROR"

# Find translation requests
aws logs filter-log-events \
  --log-group-name /ecs/translang \
  --filter-pattern "Translation"

# Count requests
aws logs filter-log-events \
  --log-group-name /ecs/translang \
  --filter-pattern "started successfully" \
  | grep -c "message"
```

---

## 📊 CloudWatch Metrics

### ECS Metrics (Automatic):

**View in Console:**
1. ECS → Clusters → translang-cluster
2. Click "Metrics" tab

**Available Metrics:**
- CPUUtilization
- MemoryUtilization
- NetworkRxBytes (received)
- NetworkTxBytes (transmitted)

### Custom Metrics (Optional):

Add to your app:

```typescript
// utils/monitoring.ts
export function logMetric(metricName: string, value: number) {
  if (process.env.NODE_ENV === 'production') {
    console.log(`METRIC|${metricName}|${value}|${Date.now()}`);
  }
}

// Usage:
logMetric('translation_latency', latency);
logMetric('translation_count', 1);
logMetric('error_count', 1);
```

---

## 🚨 CloudWatch Alarms

### Setup Alerts for Critical Issues:

#### 1. High CPU Usage

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name translang-high-cpu \
  --alarm-description "CPU usage > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=translang-service Name=ClusterName,Value=translang-cluster
```

#### 2. High Memory Usage

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name translang-high-memory \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 90 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=translang-service Name=ClusterName,Value=translang-cluster
```

#### 3. Unhealthy Tasks

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name translang-unhealthy-tasks \
  --metric-name HealthyTaskCount \
  --namespace AWS/ECS \
  --statistic Average \
  --period 60 \
  --threshold 1 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=translang-service Name=ClusterName,Value=translang-cluster
```

**Get notified via email:**
```bash
# Create SNS topic
aws sns create-topic --name translang-alerts

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:translang-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Add topic to alarms (add --alarm-actions parameter)
```

---

## 📈 CloudWatch Insights

### Query Examples:

#### 1. Count Translations Per Hour

```
fields @timestamp, @message
| filter @message like /Translation started/
| stats count() as translations by bin(1h)
```

#### 2. Average Latency

```
fields @timestamp, @message
| parse @message "Translation latency: *ms" as latency
| stats avg(latency) as avg_latency, max(latency) as max_latency
```

#### 3. Error Rate

```
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() as error_count by bin(5m)
```

#### 4. Reconnection Events

```
fields @timestamp, @message
| filter @message like /Attempting reconnection/
| count
```

---

## 🔍 Monitoring Dashboard

### Create CloudWatch Dashboard:

**AWS Console:**
1. CloudWatch → Dashboards → Create dashboard
2. Name: `translang-dashboard`
3. Add widgets:
   - Line graph: CPU Utilization
   - Line graph: Memory Utilization
   - Number: Running Tasks Count
   - Log query: Recent Errors

**CLI:**
```bash
aws cloudwatch put-dashboard \
  --dashboard-name translang-dashboard \
  --dashboard-body file://deployment/dashboard.json
```

---

## 📊 What to Monitor Daily

### Quick Health Check (2 minutes):

```bash
# 1. Check service status
aws ecs describe-services \
  --cluster translang-cluster \
  --services translang-service \
  --query "services[0].{Running:runningCount,Desired:desiredCount,Status:status}"

# 2. Check for errors (last 1 hour)
aws logs tail /ecs/translang --since 1h --filter-pattern "ERROR"

# 3. Check CPU/Memory
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=translang-service Name=ClusterName,Value=translang-cluster \
  --statistics Average \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600
```

**Healthy indicators:**
- ✅ Running count = Desired count
- ✅ Status = ACTIVE
- ✅ No errors in logs
- ✅ CPU < 70%
- ✅ Memory < 80%

---

## 🚨 Alert Thresholds

### Recommended Settings:

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| CPU Usage | 70% | 85% | Scale up |
| Memory Usage | 80% | 95% | Scale up or investigate leak |
| Error Rate | >1/min | >5/min | Check logs |
| Failed Tasks | 1 | 2+ | Check task definition |
| Latency | >500ms | >1000ms | Check Soniox API, network |
| Health Check Fails | 1 | 3+ | Restart task |

---

## 📉 Cost Monitoring

### Track AWS Costs:

```bash
# Get current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

**Setup Budget Alerts:**
1. Go to [AWS Budgets](https://console.aws.amazon.com/billing/home#/budgets)
2. Create budget
3. Set threshold: $50/month
4. Add email alert

---

## 🔧 Troubleshooting Monitoring

### No Logs Appearing:

**Check:**
```bash
# Verify log group exists
aws logs describe-log-groups --log-group-name-prefix /ecs/translang

# Verify task execution role has permissions
aws iam get-role-policy --role-name ecsTaskExecutionRole --policy-name CloudWatchLogsPolicy
```

**Fix:**
Add CloudWatch Logs permissions to execution role.

### Metrics Not Showing:

**Check:**
- Container is running
- Service is active
- Wait 5 minutes (metrics delayed)

---

## 📚 Log Analysis Tips

### Useful Patterns:

```bash
# Success rate
aws logs tail /ecs/translang --filter-pattern "started successfully" | wc -l

# Average latency from logs
aws logs tail /ecs/translang --filter-pattern "Translation latency" \
  | grep -oP '\d+ms' | sed 's/ms//' | awk '{sum+=$1; count++} END {print sum/count "ms avg"}'

# Error types
aws logs tail /ecs/translang --filter-pattern "ERROR" | grep -oP 'ERROR: \K.*' | sort | uniq -c

# Reconnection attempts
aws logs tail /ecs/translang --filter-pattern "Attempting reconnection" | wc -l
```

---

## ✅ Monitoring Checklist

Before considering monitoring complete:

- [ ] CloudWatch Logs configured
- [ ] Log group created
- [ ] Logs visible in console
- [ ] Alarms created (CPU, Memory, Health)
- [ ] SNS topic for notifications
- [ ] Email subscribed to alerts
- [ ] Dashboard created
- [ ] Budget alert configured
- [ ] Tested querying logs
- [ ] Know how to troubleshoot

---

## 🎓 Next Steps

### Advanced Monitoring (Optional):

1. **Application Performance Monitoring (APM):**
   - Integrate Datadog/New Relic
   - Track user sessions
   - Monitor API calls

2. **Custom CloudWatch Metrics:**
   - Translation count
   - User engagement
   - Feature usage

3. **X-Ray Tracing:**
   - Distributed tracing
   - Identify bottlenecks
   - Optimize performance

---

**With proper monitoring, you can ensure 99.9% uptime! 📈**


