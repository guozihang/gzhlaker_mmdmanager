import sqlite3

# 数据库文件路径
DATABASE = 'server_info.db'

# SQL命令来创建表
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS server_info (
    hostname TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    update_time DATETIME NOT NULL
);
"""

# 创建一个连接到SQLite数据库的连接
conn = sqlite3.connect(DATABASE)

# 创建一个cursor对象，用于执行SQL命令
cursor = conn.cursor()

# 执行创建表的SQL命令
cursor.execute(CREATE_TABLE_SQL)

# 提交更改
conn.commit()

# 关闭cursor
cursor.close()

# 关闭数据库连接
conn.close()

print("Table created successfully.")
