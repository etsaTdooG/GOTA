# Cấu Trúc Dự Án Android với Supabase

## Giới thiệu

Tài liệu này mô tả cấu trúc chuẩn của một dự án Android tích hợp với Supabase - một nền tảng Backend-as-a-Service (BaaS) mã nguồn mở thay thế cho Firebase.

## Cấu trúc thư mục

```
android-project/
│
├── app/                        # Module chính của ứng dụng
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/app/
│   │   │   │   ├── di/         # Dependency Injection
│   │   │   │   ├── data/       # Tầng dữ liệu
│   │   │   │   │   ├── remote/ # Giao tiếp với Supabase API
│   │   │   │   │   ├── local/  # Local database (Room)
│   │   │   │   │   ├── model/  # Data models
│   │   │   │   │   └── repository/ # Repositories
│   │   │   │   ├── domain/     # Tầng logic nghiệp vụ
│   │   │   │   │   └── usecase/ # Use cases
│   │   │   │   ├── ui/         # Tầng giao diện người dùng
│   │   │   │   │   ├── auth/   # Màn hình xác thực
│   │   │   │   │   ├── home/   # Màn hình chính
│   │   │   │   │   └── profile/ # Màn hình profile
│   │   │   │   └── utils/      # Tiện ích chung
│   │   │   │
│   │   │   ├── res/            # Resources
│   │   │   └── AndroidManifest.xml
│   │   │
│   │   └── test/               # Unit tests
│   │
│   ├── build.gradle            # Gradle config của app module
│   └── proguard-rules.pro      # ProGuard rules
│
├── buildSrc/                   # Quản lý dependencies
├── gradle/                     # Gradle wrapper
├── build.gradle                # Project level Gradle config
├── settings.gradle             # Gradle settings
└── README.md                   # Documentation
```

## Tích hợp Supabase

### Cài đặt Dependencies

Trong file `app/build.gradle`:

```gradle
dependencies {
    // Supabase
    implementation 'io.github.jan-tennert.supabase:gotrue-kt:1.2.0'  // Authentication
    implementation 'io.github.jan-tennert.supabase:postgrest-kt:1.2.0'  // Database
    implementation 'io.github.jan-tennert.supabase:storage-kt:1.2.0'  // Storage
    implementation 'io.github.jan-tennert.supabase:realtime-kt:1.2.0'  // Realtime

    // Retrofit for API calls
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.6.4'
    
    // Jetpack components
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1'
    implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.6.1'
}
```

### Cấu hình Supabase

Trong file `app/src/main/java/com/example/app/di/SupabaseModule.kt`:

```kotlin
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.GoTrue
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.storage.Storage

object SupabaseClient {
    private const val SUPABASE_URL = "https://your-project-url.supabase.co"
    private const val SUPABASE_KEY = "your-api-key"

    val client = createSupabaseClient(
        supabaseUrl = SUPABASE_URL,
        supabaseKey = SUPABASE_KEY
    ) {
        install(GoTrue)
        install(Postgrest)
        install(Storage)
    }
}
```

## API và Tính Năng

### Xác thực (Authentication)

#### Đăng ký người dùng

```kotlin
suspend fun signUp(email: String, password: String) {
    try {
        SupabaseClient.client.gotrue.signUpWith(Email) {
            this.email = email
            this.password = password
        }
    } catch (e: Exception) {
        // Xử lý lỗi
    }
}
```

#### Đăng nhập

```kotlin
suspend fun signIn(email: String, password: String) {
    try {
        SupabaseClient.client.gotrue.loginWith(Email) {
            this.email = email
            this.password = password
        }
    } catch (e: Exception) {
        // Xử lý lỗi
    }
}
```

#### Đăng xuất

```kotlin
suspend fun signOut() {
    try {
        SupabaseClient.client.gotrue.logout()
    } catch (e: Exception) {
        // Xử lý lỗi
    }
}
```

### Cơ sở dữ liệu (Database)

#### Lấy dữ liệu

```kotlin
suspend fun getTasks(): List<Task> {
    return SupabaseClient.client.postgrest["tasks"]
        .select() {
            order("created_at", ascending = false)
        }
        .decodeList<Task>()
}
```

#### Thêm dữ liệu

```kotlin
suspend fun addTask(task: Task): Task {
    return SupabaseClient.client.postgrest["tasks"]
        .insert(task)
        .decodeSingle<Task>()
}
```

#### Cập nhật dữ liệu

```kotlin
suspend fun updateTask(id: String, updates: Map<String, Any>) {
    SupabaseClient.client.postgrest["tasks"]
        .update(updates) {
            filter("id", "eq", id)
        }
}
```

#### Xóa dữ liệu

```kotlin
suspend fun deleteTask(id: String) {
    SupabaseClient.client.postgrest["tasks"]
        .delete {
            filter("id", "eq", id)
        }
}
```

### Lưu trữ (Storage)

#### Tải lên file

```kotlin
suspend fun uploadFile(bucket: String, path: String, file: ByteArray): String {
    SupabaseClient.client.storage.from(bucket).upload(path, file)
    return SupabaseClient.client.storage.from(bucket).publicUrl(path)
}
```

#### Tải xuống file

```kotlin
suspend fun downloadFile(bucket: String, path: String): ByteArray {
    return SupabaseClient.client.storage.from(bucket).download(path)
}
```

#### Xóa file

```kotlin
suspend fun deleteFile(bucket: String, path: String) {
    SupabaseClient.client.storage.from(bucket).delete(path)
}
```

### Realtime Subscriptions

```kotlin
fun subscribeToTasks(onUpdate: (List<Task>) -> Unit) {
    SupabaseClient.client.realtime.channel("tasks_channel")
        .on(RealtimeChannel.PresenceEvent.SYNC) { 
            // Xử lý khi kết nối đồng bộ
        }
        .on("tasks") { 
            val tasks = it.decodeList<Task>()
            onUpdate(tasks)
        }
        .subscribe()
}
```

## Bảo mật

- Dùng ProGuard để mã hóa mã nguồn
- Lưu trữ API keys trong `local.properties` (không đưa lên git)
- Sử dụng biện pháp xác thực phù hợp
- Kết nối qua HTTPS
- Sử dụng Row Level Security (RLS) của Supabase

## CI/CD

- GitHub Actions cho việc build, test và deploy
- Firebase App Distribution hoặc Google Play Internal Testing cho việc phân phối bản beta

## Kiểm thử

- Unit tests cho các repository và use cases
- UI tests với Espresso
- Integration tests với API Supabase (sử dụng môi trường test)

## Chi tiết về Tương tác với API Supabase

### Mô hình API Layer

Một thiết kế API layer tốt nên được tổ chức theo các lớp sau:

1. **Service Layer**: Chứa các interface API, định nghĩa các phương thức gọi API
2. **Repository Layer**: Thực hiện các tác vụ dữ liệu, kết hợp dữ liệu từ nhiều nguồn
3. **DataSource Layer**: Thực hiện các cuộc gọi API thực tế tới Supabase
4. **Model Layer**: Định nghĩa các đối tượng dữ liệu

#### Ví dụ về Service Layer

```kotlin
interface TaskService {
    suspend fun getTasks(): Result<List<Task>>
    suspend fun getTaskById(id: String): Result<Task>
    suspend fun createTask(task: Task): Result<Task>
    suspend fun updateTask(id: String, updates: Map<String, Any>): Result<Boolean>
    suspend fun deleteTask(id: String): Result<Boolean>
}
```

#### Ví dụ về Repository Layer

```kotlin
class TaskRepository(
    private val remoteDataSource: TaskRemoteDataSource,
    private val localDataSource: TaskLocalDataSource
) : TaskService {
    override suspend fun getTasks(): Result<List<Task>> {
        return try {
            // Kiểm tra kết nối mạng
            if (networkUtils.isNetworkAvailable()) {
                // Lấy dữ liệu từ remote
                val remoteTasks = remoteDataSource.getTasks()
                // Lưu vào local cache
                localDataSource.saveTasks(remoteTasks)
                Result.success(remoteTasks)
            } else {
                // Sử dụng dữ liệu local khi không có kết nối
                Result.success(localDataSource.getTasks())
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Các phương thức khác tương tự
}
```

#### Ví dụ về DataSource Layer

```kotlin
class TaskRemoteDataSource(private val supabaseClient: SupabaseClient) {
    suspend fun getTasks(): List<Task> {
        return supabaseClient.postgrest["tasks"]
            .select() {
                order("created_at", ascending = false)
            }
            .decodeList<Task>()
    }
    
    suspend fun getTaskById(id: String): Task {
        return supabaseClient.postgrest["tasks"]
            .select() {
                filter("id", "eq", id)
            }
            .decodeSingle<Task>()
    }
    
    suspend fun createTask(task: Task): Task {
        return supabaseClient.postgrest["tasks"]
            .insert(task)
            .decodeSingle<Task>()
    }
    
    // Các phương thức khác tương tự
}
```

### Chi tiết về các Phương thức HTTP

#### GET (Lấy dữ liệu)

Các tùy chọn nâng cao khi lấy dữ liệu:

```kotlin
suspend fun getTasksAdvanced(): List<Task> {
    return supabaseClient.postgrest["tasks"]
        .select() {
            // Lọc theo điều kiện
            filter("completed", "eq", false)  // completed = false
            filter("priority", "gte", 2)      // priority >= 2
            
            // Lọc theo phạm vi
            filter("due_date", "gte", "2023-01-01")
            filter("due_date", "lte", "2023-12-31")
            
            // Lọc theo mảng
            filter("tags", "cs", "{work,urgent}")  // contains
            
            // Tìm kiếm theo văn bản
            textSearch("title", "meeting", TextSearchType.PLAIN)
            
            // Sắp xếp
            order("due_date", ascending = true)
            order("priority", ascending = false)
            
            // Phân trang
            limit(20)
            offset(0)
            
            // Chọn cột cụ thể
            select("id", "title", "due_date")
            
            // Lấy dữ liệu từ bảng quan hệ (joins)
            foreignTable("comments") {
                select("id", "content")
                filter("created_at", "gte", "2023-01-01")
                limit(5)
            }
        }
        .decodeList<Task>()
}
```

#### POST (Tạo dữ liệu)

Tạo nhiều bản ghi cùng lúc:

```kotlin
suspend fun createMultipleTasks(tasks: List<Task>): List<Task> {
    return supabaseClient.postgrest["tasks"]
        .insert(tasks)
        .decodeList<Task>()
}
```

Tạo bản ghi và xử lý xung đột (upsert):

```kotlin
suspend fun upsertTask(task: Task): Task {
    return supabaseClient.postgrest["tasks"]
        .upsert(task, onConflict = "id") // Cập nhật nếu đã tồn tại
        .decodeSingle<Task>()
}
```

#### PATCH/PUT (Cập nhật dữ liệu)

Cập nhật có điều kiện phức tạp:

```kotlin
suspend fun updateCompletedTasks(updates: Map<String, Any>) {
    supabaseClient.postgrest["tasks"]
        .update(updates) {
            filter("completed", "eq", true)
            filter("due_date", "lt", LocalDate.now().toString())
        }
}
```

#### DELETE (Xóa dữ liệu)

Xóa có điều kiện:

```kotlin
suspend fun deleteCompletedTasks() {
    supabaseClient.postgrest["tasks"]
        .delete {
            filter("completed", "eq", true)
            filter("created_at", "lt", LocalDate.now().minusMonths(6).toString())
        }
}
```

### Quản lý Lỗi và Trạng thái mạng

Mô hình Result để quản lý lỗi:

```kotlin
sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(val exception: Exception) : ApiResult<Nothing>()
    object Loading : ApiResult<Nothing>()
}

suspend fun safeApiCall(apiCall: suspend () -> T): ApiResult<T> {
    return try {
        ApiResult.Success(apiCall())
    } catch (e: Exception) {
        when (e) {
            is IOException -> ApiResult.Error(NetworkException(e))
            is HttpException -> {
                val code = e.code()
                val errorResponse = e.response()?.errorBody()?.string()
                ApiResult.Error(HttpErrorException(code, errorResponse))
            }
            else -> ApiResult.Error(UnknownException(e))
        }
    }
}
```

Sử dụng trong Repository:

```kotlin
override suspend fun getTasks(): ApiResult<List<Task>> {
    return safeApiCall {
        supabaseClient.postgrest["tasks"]
            .select()
            .decodeList<Task>()
    }
}
```

### Sử dụng Supabase Functions

Supabase Functions cho phép bạn triển khai API Edge Functions:

```kotlin
suspend fun callServerFunction(payload: Map<String, Any>): ApiResult<FunctionResponse> {
    return safeApiCall {
        supabaseClient.functions.invoke(
            functionName = "process-payment",
            body = Json.encodeToString(payload),
            headers = mapOf("Content-Type" to "application/json")
        )
    }
}
```

### Sử dụng RLS (Row Level Security)

Cách thiết lập RLS policies trên Supabase Dashboard:

1. Mỗi bảng nên có các policies sau:
   - SELECT policy: Kiểm soát ai có thể đọc dữ liệu
   - INSERT policy: Kiểm soát ai có thể thêm dữ liệu
   - UPDATE policy: Kiểm soát ai có thể cập nhật dữ liệu
   - DELETE policy: Kiểm soát ai có thể xóa dữ liệu

Ví dụ về các policies:

```sql
-- SELECT policy (Người dùng chỉ thấy các tasks của chính họ)
CREATE POLICY "Users can view their own tasks" ON tasks
FOR SELECT USING (auth.uid() = user_id);

-- INSERT policy (Người dùng chỉ tạo tasks cho chính họ)
CREATE POLICY "Users can create their own tasks" ON tasks
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE policy (Người dùng chỉ cập nhật tasks của chính họ)
CREATE POLICY "Users can update their own tasks" ON tasks
FOR UPDATE USING (auth.uid() = user_id);

-- DELETE policy (Người dùng chỉ xóa tasks của chính họ)
CREATE POLICY "Users can delete their own tasks" ON tasks
FOR DELETE USING (auth.uid() = user_id);
```

### Xử lý JWT và Token

```kotlin
class AuthManager(private val supabaseClient: SupabaseClient) {
    // Lấy token hiện tại
    fun getCurrentToken(): String? {
        return supabaseClient.gotrue.currentSessionOrNull()?.accessToken
    }
    
    // Kiểm tra token còn hạn hay không
    fun isTokenValid(): Boolean {
        val session = supabaseClient.gotrue.currentSessionOrNull() ?: return false
        return session.expiresAt > System.currentTimeMillis()
    }
    
    // Làm mới token
    suspend fun refreshToken() {
        try {
            supabaseClient.gotrue.refreshCurrentSession()
        } catch (e: Exception) {
            // Xử lý lỗi, có thể cần đăng nhập lại
        }
    }
    
    // Lấy thông tin từ token
    fun getUserIdFromToken(): String? {
        return supabaseClient.gotrue.currentUserOrNull()?.id
    }
}
```

### Tích hợp Realtime với Flow và Coroutines

Sử dụng kotlin Flow để xử lý dữ liệu realtime:

```kotlin
class RealtimeRepository(private val supabaseClient: SupabaseClient) {
    fun subscribeToTasksAsFlow(): Flow<List<Task>> = callbackFlow {
        val channel = supabaseClient.realtime.channel("tasks_channel")
        
        // Thiết lập listener
        channel.on<JsonObject>("INSERT", schema = "public", table = "tasks") { payload ->
            // Xử lý khi có dữ liệu mới
            val newTask = Json.decodeFromJsonElement<Task>(payload.newRecord)
            val currentList = trySend(currentList + newTask).isSuccess
        }
        
        channel.on<JsonObject>("UPDATE", schema = "public", table = "tasks") { payload ->
            // Xử lý khi dữ liệu được cập nhật
            val updatedTask = Json.decodeFromJsonElement<Task>(payload.newRecord)
            val updatedList = currentList.map { if (it.id == updatedTask.id) updatedTask else it }
            trySend(updatedList).isSuccess
        }
        
        channel.on<JsonObject>("DELETE", schema = "public", table = "tasks") { payload ->
            // Xử lý khi dữ liệu bị xóa
            val deletedId = Json.decodeFromJsonElement<Task>(payload.oldRecord).id
            val updatedList = currentList.filter { it.id != deletedId }
            trySend(updatedList).isSuccess
        }
        
        // Đăng ký kênh
        channel.subscribe()
        
        // Khi flow bị hủy, ngắt kết nối
        awaitClose {
            channel.unsubscribe()
        }
    }
}
```

### Caching và Offline Support

Sử dụng Room để lưu trữ dữ liệu offline:

```kotlin
@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String?,
    val completed: Boolean,
    val dueDate: String?,
    val userId: String,
    val createdAt: String,
    val updatedAt: String,
    // Thêm trường syncStatus để đánh dấu những thay đổi chưa được đồng bộ
    val syncStatus: SyncStatus = SyncStatus.SYNCED
)

enum class SyncStatus {
    SYNCED,      // Đã đồng bộ với server
    TO_UPDATE,   // Cần cập nhật lên server
    TO_INSERT,   // Cần thêm lên server
    TO_DELETE    // Cần xóa trên server
}

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks ORDER BY dueDate ASC")
    fun getAllTasks(): Flow<List<TaskEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTasks(tasks: List<TaskEntity>)
    
    @Update
    suspend fun updateTask(task: TaskEntity)
    
    @Delete
    suspend fun deleteTask(task: TaskEntity)
    
    // Lấy các task cần đồng bộ
    @Query("SELECT * FROM tasks WHERE syncStatus != 'SYNCED'")
    suspend fun getUnsyncedTasks(): List<TaskEntity>
}
```

### Đồng bộ hóa dữ liệu khi có kết nối trở lại

```kotlin
class SyncManager(
    private val taskDao: TaskDao,
    private val supabaseClient: SupabaseClient,
    private val connectivityManager: ConnectivityManager
) {
    suspend fun syncData() {
        if (!isNetworkAvailable()) return
        
        val unsyncedTasks = taskDao.getUnsyncedTasks()
        
        // Xử lý các task cần thêm
        val tasksToInsert = unsyncedTasks.filter { it.syncStatus == SyncStatus.TO_INSERT }
        tasksToInsert.forEach { task ->
            try {
                val newTask = supabaseClient.postgrest["tasks"]
                    .insert(task.toTaskDto())
                    .decodeSingle<TaskDto>()
                    
                // Cập nhật lại trạng thái đã đồng bộ
                taskDao.updateTask(task.copy(
                    id = newTask.id,
                    syncStatus = SyncStatus.SYNCED
                ))
            } catch (e: Exception) {
                // Xử lý lỗi
            }
        }
        
        // Tương tự với UPDATE và DELETE
        // ...
    }
    
    private fun isNetworkAvailable(): Boolean {
        val networkCapabilities = connectivityManager.getNetworkCapabilities(
            connectivityManager.activeNetwork
        )
        return networkCapabilities != null &&
                (networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                 networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR))
    }
}
```

### Xử lý Pagination với Paging 3

```kotlin
class TaskPagingSource(
    private val supabaseClient: SupabaseClient
) : PagingSource<Int, Task>() {
    
    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Task> {
        val page = params.key ?: 0
        val pageSize = params.loadSize
        
        return try {
            val tasks = supabaseClient.postgrest["tasks"]
                .select() {
                    limit(pageSize)
                    offset(page * pageSize)
                    order("created_at", ascending = false)
                }
                .decodeList<Task>()
                
            LoadResult.Page(
                data = tasks,
                prevKey = if (page > 0) page - 1 else null,
                nextKey = if (tasks.size == pageSize) page + 1 else null
            )
        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }
}

@HiltViewModel
class TaskViewModel @Inject constructor(
    private val supabaseClient: SupabaseClient
) : ViewModel() {
    
    val tasksPagingFlow = Pager(
        config = PagingConfig(
            pageSize = 20,
            enablePlaceholders = false,
            maxSize = 100
        ),
        pagingSourceFactory = { TaskPagingSource(supabaseClient) }
    ).flow
}
```

### Test APIs với MockWebServer

```kotlin
class TaskRepositoryTest {
    private lateinit var mockWebServer: MockWebServer
    private lateinit var supabaseClient: SupabaseClient
    private lateinit var taskRepository: TaskRepository
    
    @Before
    fun setup() {
        mockWebServer = MockWebServer()
        mockWebServer.start()
        
        val baseUrl = mockWebServer.url("/").toString()
        
        // Tạo Supabase client giả với URL tới mock server
        supabaseClient = createSupabaseClient(
            supabaseUrl = baseUrl,
            supabaseKey = "test-api-key"
        ) {
            install(GoTrue)
            install(Postgrest)
        }
        
        taskRepository = TaskRepository(supabaseClient)
    }
    
    @Test
    fun `getTasks returns success when API call succeeds`() = runTest {
        // Arrange
        val mockResponse = """
            [
                {
                    "id": "1",
                    "title": "Task 1",
                    "completed": false,
                    "user_id": "user123",
                    "created_at": "2023-01-01T00:00:00Z"
                }
            ]
        """.trimIndent()
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(mockResponse)
                .addHeader("Content-Type", "application/json")
        )
        
        // Act
        val result = taskRepository.getTasks()
        
        // Assert
        assertTrue(result is ApiResult.Success)
        val tasks = (result as ApiResult.Success).data
        assertEquals(1, tasks.size)
        assertEquals("Task 1", tasks[0].title)
    }
    
    @After
    fun tearDown() {
        mockWebServer.shutdown()
    }
}
```

### Các Mẫu UI và Tích hợp ViewModel

```kotlin
@HiltViewModel
class TaskViewModel @Inject constructor(
    private val taskRepository: TaskRepository
) : ViewModel() {
    
    private val _tasksState = MutableStateFlow<UiState<List<Task>>>(UiState.Loading)
    val tasksState: StateFlow<UiState<List<Task>>> = _tasksState.asStateFlow()
    
    init {
        loadTasks()
    }
    
    fun loadTasks() {
        viewModelScope.launch {
            _tasksState.value = UiState.Loading
            
            when (val result = taskRepository.getTasks()) {
                is ApiResult.Success -> _tasksState.value = UiState.Success(result.data)
                is ApiResult.Error -> _tasksState.value = UiState.Error(result.exception.message ?: "Lỗi không xác định")
            }
        }
    }
    
    fun addTask(task: Task) {
        viewModelScope.launch {
            when (val result = taskRepository.createTask(task)) {
                is ApiResult.Success -> loadTasks()  // Tải lại danh sách
                is ApiResult.Error -> _tasksState.value = UiState.Error(result.exception.message ?: "Lỗi khi thêm task")
            }
        }
    }
}

sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}
```

### Composable UI với Loading States

```kotlin
@Composable
fun TasksScreen(viewModel: TaskViewModel = hiltViewModel()) {
    val tasksState by viewModel.tasksState.collectAsState()
    
    when (val state = tasksState) {
        is UiState.Loading -> LoadingIndicator()
        is UiState.Success -> TaskList(tasks = state.data, onTaskClick = { /* Xử lý click */ })
        is UiState.Error -> ErrorMessage(message = state.message)
    }
}

@Composable
fun LoadingIndicator() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}

@Composable
fun TaskList(tasks: List<Task>, onTaskClick: (Task) -> Unit) {
    LazyColumn {
        items(tasks) { task ->
            TaskItem(task = task, onClick = { onTaskClick(task) })
        }
    }
}

@Composable
fun ErrorMessage(message: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.Error,
            contentDescription = null,
            tint = MaterialTheme.colors.error
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = message,
            color = MaterialTheme.colors.error,
            textAlign = TextAlign.Center
        )
    }
}
```

## Hiệu suất và Tối ưu hóa

### Caching Responses

```kotlin
class HttpCache(context: Context) {
    private val cacheSize = 10 * 1024 * 1024 // 10 MB
    private val cache = Cache(File(context.cacheDir, "http_cache"), cacheSize.toLong())
    
    fun getOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .cache(cache)
            .addInterceptor { chain ->
                var request = chain.request()
                
                // Thêm headers cho caching
                request = request.newBuilder()
                    .header("Cache-Control", "public, max-age=60") // Cache trong 1 phút
                    .build()
                    
                chain.proceed(request)
            }
            .build()
    }
}
```

### Prefetching Data

```kotlin
class DataPrefetcher(
    private val taskRepository: TaskRepository,
    private val workManager: WorkManager
) {
    fun schedulePrefetch() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
            
        val prefetchRequest = OneTimeWorkRequestBuilder<PrefetchWorker>()
            .setConstraints(constraints)
            .build()
            
        workManager.enqueue(prefetchRequest)
    }
}

class PrefetchWorker(
    context: Context,
    params: WorkerParameters,
    private val taskRepository: TaskRepository
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        return try {
            // Prefetch dữ liệu và lưu vào local
            taskRepository.prefetchAndCacheTasks()
            Result.success()
        } catch (e: Exception) {
            Result.failure()
        }
    }
}
```

## Debugging và Monitoring

### Logging

```kotlin
class SupabaseLogger(private val isDebug: Boolean) {
    fun log(tag: String, message: String) {
        if (isDebug) {
            Log.d(tag, message)
        }
    }
    
    fun logError(tag: String, message: String, throwable: Throwable? = null) {
        if (isDebug) {
            Log.e(tag, message, throwable)
        }
    }
}

// Sử dụng interceptor để log network requests
class NetworkLogInterceptor(private val logger: SupabaseLogger) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        
        logger.log("API_REQUEST", "URL: ${request.url}, Method: ${request.method}")
        
        val startTime = System.currentTimeMillis()
        val response = chain.proceed(request)
        val duration = System.currentTimeMillis() - startTime
        
        logger.log("API_RESPONSE", "URL: ${request.url}, Time: ${duration}ms, Code: ${response.code}")
        
        return response
    }
}
```

### Phân tích và Giám sát 

```kotlin
class PerformanceMonitor(
    private val supabaseClient: SupabaseClient,
    private val context: Context
) {
    suspend fun logApiMetrics(endpoint: String, duration: Long, statusCode: Int) {
        try {
            // Gửi metrics tới Supabase
            supabaseClient.postgrest["api_metrics"]
                .insert(
                    ApiMetric(
                        endpoint = endpoint,
                        duration = duration,
                        statusCode = statusCode,
                        deviceModel = Build.MODEL,
                        osVersion = Build.VERSION.SDK_INT.toString(),
                        appVersion = context.packageManager.getPackageInfo(context.packageName, 0).versionName
                    )
                )
        } catch (e: Exception) {
            // Bỏ qua lỗi khi ghi metrics
        }
    }
}

data class ApiMetric(
    val endpoint: String,
    val duration: Long, // milliseconds
    val statusCode: Int,
    val deviceModel: String,
    val osVersion: String,
    val appVersion: String,
    val timestamp: String = LocalDateTime.now().toString()
)
```