using Microsoft.EntityFrameworkCore;

namespace SensorApi.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Device> Devices { get; set; }
        public DbSet<SensorData> SensorDataEntries { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Device>(entity =>
            {
                entity.ToTable("devices_table"); 
            });
            modelBuilder.Entity<SensorData>(entity =>
            {
                entity.ToTable("sensor_data_table");

                entity.Property(e => e.DeviceId)
                      .HasColumnName("device_id");

                entity.HasOne(e => e.Device)
                      .WithMany()
                      .HasForeignKey(e => e.DeviceId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }

    }
}
