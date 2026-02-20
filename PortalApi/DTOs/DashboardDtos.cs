namespace PortalApi.DTOs;

public class DashboardDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LayoutConfig { get; set; } = "[]";
    public int RefreshIntervalSeconds { get; set; }
    public bool IsDefault { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateDashboardDto
{
    public string Name { get; set; } = string.Empty;
    public int RefreshIntervalSeconds { get; set; } = 30;
    public bool IsDefault { get; set; } = false;
}

public class UpdateDashboardDto
{
    public string? Name { get; set; }
    public string? LayoutConfig { get; set; }
    public int? RefreshIntervalSeconds { get; set; }
    public bool? IsDefault { get; set; }
}
