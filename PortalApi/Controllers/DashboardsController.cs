using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalApi.Data;
using PortalApi.DTOs;
using PortalApi.Models;

namespace PortalApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardsController : ControllerBase
{
    private readonly AppDbContext _db;

    public DashboardsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var dashboards = await _db.Dashboards
            .Select(d => new DashboardDto
            {
                Id = d.Id,
                Name = d.Name,
                LayoutConfig = d.LayoutConfig,
                RefreshIntervalSeconds = d.RefreshIntervalSeconds,
                IsDefault = d.IsDefault,
                UpdatedAt = d.UpdatedAt
            })
            .OrderBy(d => d.Name)
            .ToListAsync();

        return Ok(dashboards);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _db.Dashboards.FindAsync(id);
        if (d == null) return NotFound();

        return Ok(new DashboardDto
        {
            Id = d.Id,
            Name = d.Name,
            LayoutConfig = d.LayoutConfig,
            RefreshIntervalSeconds = d.RefreshIntervalSeconds,
            IsDefault = d.IsDefault,
            UpdatedAt = d.UpdatedAt
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateDashboardDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        // If setting as default, unset others
        if (dto.IsDefault)
        {
            var existing = await _db.Dashboards.Where(d => d.IsDefault).ToListAsync();
            existing.ForEach(d => d.IsDefault = false);
        }

        var dashboard = new Dashboard
        {
            Name = dto.Name,
            LayoutConfig = "[]",
            RefreshIntervalSeconds = dto.RefreshIntervalSeconds,
            CreatedByUserId = userId,
            IsDefault = dto.IsDefault,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Dashboards.Add(dashboard);
        await _db.SaveChangesAsync();

        return Created($"/api/dashboards/{dashboard.Id}", new DashboardDto
        {
            Id = dashboard.Id,
            Name = dashboard.Name,
            LayoutConfig = dashboard.LayoutConfig,
            RefreshIntervalSeconds = dashboard.RefreshIntervalSeconds,
            IsDefault = dashboard.IsDefault,
            UpdatedAt = dashboard.UpdatedAt
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDashboardDto dto)
    {
        var dashboard = await _db.Dashboards.FindAsync(id);
        if (dashboard == null) return NotFound();

        if (dto.Name != null) dashboard.Name = dto.Name;
        if (dto.LayoutConfig != null) dashboard.LayoutConfig = dto.LayoutConfig;
        if (dto.RefreshIntervalSeconds.HasValue) dashboard.RefreshIntervalSeconds = dto.RefreshIntervalSeconds.Value;

        if (dto.IsDefault == true)
        {
            var existing = await _db.Dashboards.Where(d => d.IsDefault && d.Id != id).ToListAsync();
            existing.ForEach(d => d.IsDefault = false);
            dashboard.IsDefault = true;
        }

        dashboard.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new DashboardDto
        {
            Id = dashboard.Id,
            Name = dashboard.Name,
            LayoutConfig = dashboard.LayoutConfig,
            RefreshIntervalSeconds = dashboard.RefreshIntervalSeconds,
            IsDefault = dashboard.IsDefault,
            UpdatedAt = dashboard.UpdatedAt
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var dashboard = await _db.Dashboards.FindAsync(id);
        if (dashboard == null) return NotFound();

        _db.Dashboards.Remove(dashboard);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
