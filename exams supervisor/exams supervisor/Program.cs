using System.Diagnostics;
using System.Text.Json;
using exams_supervisor.BusinessLogic;
using exams_supervisor.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using OfficeOpenXml;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
//builder.Services.AddScoped<TeacherDataProcessor>(); // Register business logic
builder.Services.AddSingleton<TeacherDataProcessor>(); // Register business logic as singleton
builder.Services.AddSingleton<SessionDataProcessor>(); // Register business logic as singleton
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
	options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10 MB
});
builder.Services.AddHttpClient("PythonService", client =>
{
	client.BaseAddress = new Uri("http://your-python-api-url.com"); // Replace with actual URL
	client.DefaultRequestHeaders.Add("Accept", "application/json");
});
var app = builder.Build();

//app.UsePathBase("/swagger/index.html");
ExcelPackage.License.SetNonCommercialPersonal("Mohaned");

if (app.Environment.IsDevelopment())
{
	app.UseSwagger();
	app.UseSwaggerUI();
	app.MapGet("/", () => Results.Redirect("/swagger")).WithTags("Swagger");
}
else
{
	app.UseExceptionHandler("/Error");
	app.UseHsts(); // Force l'utilisation de HSTS en production
}



app.MapGet("/hello", () => "Hello World!").WithTags("Demo");

// Endpoint to upload Excel file
app.MapPost("/upload-excelTeachers", (IFormFile file, TeacherDataProcessor Tprocessor, SessionDataProcessor Sprocessor) =>
{
	if (file == null || file.Length == 0)
		return Results.BadRequest("No file uploaded.");
	try
	{
		using var stream = file.OpenReadStream();
		Tprocessor.LoadExcelData(stream, Sprocessor.GetAllSessions());
		return Results.Ok("Excel file processed successfully.");
	}
	catch (Exception ex)
	{
		return Results.Problem($"Error processing Excel file: {ex.Message}");
	}
}).WithTags("Teachers").Accepts<IFormFile>("multipart/form-data").DisableAntiforgery();

// Endpoint to search teachers
app.MapGet("/teachersSearsh", (TeacherDataProcessor Tprocessor,
	string? name = null,
	string? grade = null,
	int? minHourlyLoad = null,
	int? maxHourlyLoad = null) =>
{
	var teachers = Tprocessor.SearchTeachers(name, grade, minHourlyLoad, maxHourlyLoad);
	return Results.Ok(teachers);
}).WithTags("Teachers");

// Endpoint to get all teachers
app.MapGet("/teachers", (TeacherDataProcessor Tprocessor) =>
{
	List<TeacherInfo> teachers = Tprocessor.GetAllTeachers();
	return Results.Ok(teachers);
}).WithTags("Teachers");

// Endpoint to get all teachers
app.MapGet("/somme", (TeacherDataProcessor Tprocessor) => {
	List<int> somme = Tprocessor.GetSommeBValues();
	return Results.Ok(somme);
}).WithTags("Teachers");


// POST /sessions - reads from configured file path
app.MapPost("/upload-excelSessions", (IFormFile file, SessionDataProcessor Sprocessor, TeacherDataProcessor Tprocessor) =>
{

	if (file == null || file.Length == 0)
		return Results.BadRequest("No file uploaded.");

	try
	{
		using var stream = file.OpenReadStream();
		Sprocessor.LoadExcelData(stream,Tprocessor.GetSommeBValues());
		return Results.Ok("Excel file processed successfully.");
	}
	catch (Exception ex)
	{
		return Results.Problem($"Error processing Excel file: {ex.Message}");
	}
})
.WithTags("Sessions")
.Accepts<IFormFile>("multipart/form-data")
.DisableAntiforgery();

// Endpoint to get all sessions
app.MapGet("/sessions", (SessionDataProcessor Sprocessor) =>
{
	List<Session> sessions = Sprocessor.GetAllSessions();
	return Results.Ok(sessions);
}).WithTags("Sessions");

// Endpoint to get all sessions days and date
app.MapGet("/sessionsDayDate", (SessionDataProcessor Sprocessor) =>
{
	var days = Sprocessor.GetAlldaysSessions();
	var dates = Sprocessor.GetAlldateSessions();
	var type = Sprocessor.GetAllSessions().Select(s => s.Type.ToString()).First();
	var sessionsDayDate = new { type,days,dates };
	return Results.Ok(sessionsDayDate);
}).WithTags("Sessions");




app.MapGet("/schedule", async (
	TeacherDataProcessor Tprocessor,
	SessionDataProcessor Sprocessor,
	IHttpClientFactory httpClientFactory) =>
{
	var teachers = Tprocessor.GetAllTeachers();
	var sessions = Sprocessor.GetAllSessions();

	var payload = new { teachers, sessions };
	var client = httpClientFactory.CreateClient("PythonService");
	client.Timeout = TimeSpan.FromSeconds(30); // Set based on GA duration

	try
	{
		var response = await client.PostAsJsonAsync("/api/schedule", payload);

		if (!response.IsSuccessStatusCode)
		{
			var body = await response.Content.ReadAsStringAsync();
			return Results.Problem($"Python service error: {response.StatusCode} - {body}");
		}

		var result = await response.Content.ReadFromJsonAsync<List<TeachersScheduling>>();

		if (result == null)
			return Results.Problem("Received empty or malformed data");

		return Results.Ok(result);
	}
	catch (TaskCanceledException ex)
	{
		return Results.Problem("The request to the scheduling service timed out.");
	}
	catch (HttpRequestException ex)
	{
		return Results.Problem($"HTTP error: {ex.Message}");
	}
	catch (JsonException ex)
	{
		return Results.Problem($"Invalid JSON from Python service: {ex.Message}");
	}
	catch (Exception ex)
	{
		return Results.Problem($"Unexpected error: {ex.Message}");
	}
});




app.Run();
