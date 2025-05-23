using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
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
	client.BaseAddress = new Uri("http://127.0.0.1:8000"); // Replace with actual URL
	client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// Configure CORS
builder.Services.AddCors(options =>
{
	options.AddPolicy("AllowReactApp", policy =>
	{
		policy.WithOrigins("http://localhost:5173") // Allow requests from React front-end
			  .AllowAnyMethod()                     // Allow GET, POST, etc.
			  .AllowAnyHeader();                    // Allow any headers
	});
});
var app = builder.Build();
app.UseCors("AllowReactApp");
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
		if (Sprocessor.GetAllSessions().Count() == 0)
			return Results.Problem($"Error processing Excel file");
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

	var payload = new { sessions, teachers };
	
	//Console.WriteLine($"Payload: {JsonSerializer.Serialize(payload)}");
	var client = httpClientFactory.CreateClient("PythonService");
	client.Timeout = TimeSpan.FromSeconds(2000); // Set based on GA duration

	try
	{
		// Configure JsonSerializerOptions to serialize enums as strings
		var jsonOptions = new JsonSerializerOptions
		{
			Converters = { new JsonStringEnumConverter() },
			PropertyNamingPolicy = JsonNamingPolicy.CamelCase // Optional: Ensure camelCase for Python compatibility
		};
		//Console.WriteLine($"Payload: {JsonSerializer.Serialize(payload, jsonOptions)}");
		var response = await client.PostAsJsonAsync("/schedule", payload, jsonOptions);

		if (!response.IsSuccessStatusCode)
		{
			var body = await response.Content.ReadAsStringAsync();
			return Results.Problem($"Python service error: {response.StatusCode} - {body}");
		}

		var result = await response.Content.ReadFromJsonAsync<List<TeachersScheduling>>();
		Console.WriteLine($"Result: {JsonSerializer.Serialize(result)}");
		if (result == null)
			return Results.Problem("Received empty or malformed data");

		//string jsonFilePath = "C:\\Users\\fathi\\source\\repos\\Exams Supervisor application\\frontend\\src\\test\\response_teachers.json"; // Update with actual path
		//string jsonString = await System.IO.File.ReadAllTextAsync(jsonFilePath);
		//List <TeachersScheduling> sch = JsonSerializer.Deserialize<List<TeachersScheduling>>(jsonString, new JsonSerializerOptions
		//{
		//	PropertyNameCaseInsensitive = true // Optional: handle case-insensitive property names
		//});

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
