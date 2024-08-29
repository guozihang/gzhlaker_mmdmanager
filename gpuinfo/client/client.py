import argparse
import json
import requests
import time
import socket
import psutil
import json

# Define the command-line arguments
parser = argparse.ArgumentParser(description='Simple program to get server information')
parser.add_argument('--server', default='gpu', help='Server type, GPU server or CPU server')
parser.add_argument('--address', default='http://101.43.186.22:7070/update', help='Host server IP address')
parser.add_argument('--interval', type=int, default=60, help='Upload interval (sec)')
args = parser.parse_args()

# ServerInfo equivalent in Python
class ServerInfo:
    def __init__(self, password, addr):
        self.password = password
        self.addr = addr

# Function to get GPU information (Placeholder, as Python doesn't have a direct equivalent of nvidia-smi)
import subprocess
import shlex

# Placeholder for GPUDetail equivalent in Python
class GPUDetail:
    def __init__(self, name="", driver_version="", temperature_gpu="", utilization_gpu="", utilization_memory="", memory_total="", memory_free="", memory_used=""):
        self.name = name
        self.driver_version = driver_version
        self.temperature_gpu = temperature_gpu
        self.utilization_gpu = utilization_gpu
        self.utilization_memory = utilization_memory
        self.memory_total = memory_total
        self.memory_free = memory_free
        self.memory_used = memory_used

    def to_dict(self):
        return {
            "name": self.name,
            "driver_version": self.driver_version,
            "temperature_gpu": self.temperature_gpu,
            "utilization_gpu": self.utilization_gpu,
            "utilization_memory": self.utilization_memory,
            "memory_total": self.memory_total,
            "memory_free": self.memory_free,
            "memory_used": self.memory_used
        }

    def to_json(self):
        return json.dumps(self.to_dict(), indent=4)

    @staticmethod
    def empty():
        # Create an empty GPUDetail instance and return its JSON representation
        return GPUDetail().to_json()

# Placeholder for GPUInfo equivalent in Python
class GPUInfo:
    def __init__(self, detail=None, users=None):
        if detail is None:
            detail = [GPUDetail.empty()]
        if users is None:
            users = ["null"]
        self.detail = detail
        self.users = users

# Placeholder for _gpu_users function equivalent in Python
def _gpu_users():
    # This function should be implemented to retrieve the list of GPU users.
    # For now, we'll return an empty list and a status of 0.
    return [], 0

def get_gpu_info():
    users, status = _gpu_users()
    detail = []
    if status != -1:
        # Run the nvidia-smi command and get the output
        nvidia_smi_query = "nvidia-smi --query-gpu=name,driver_version,temperature.gpu,utilization.gpu,utilization.memory,memory.total,memory.free,memory.used --format=csv,noheader"
        process = subprocess.Popen(shlex.split(nvidia_smi_query), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()
        if process.returncode == 0:
            # Decode the bytes to string and split by newlines to get each GPU's info
            gpus_info = stdout.decode().strip().split('\n')
            for gpu_info in gpus_info:
                split_line = gpu_info.split(", ")
                if len(split_line) == 8:
                    # Create a GPUDetail object for each GPU
                    detail.append(GPUDetail(
                        name=split_line[0].strip(),
                        driver_version=split_line[1].strip(),
                        temperature_gpu=split_line[2].strip(),
                        utilization_gpu=split_line[3].strip(),
                        utilization_memory=split_line[4].strip(),
                        memory_total=split_line[5].strip(),
                        memory_free=split_line[6].strip(),
                        memory_used=split_line[7].strip()
                    ).to_dict())
                else:
                    detail.append(GPUDetail.empty())
        else:
            print(f"Failed to execute nvidia-smi: {stderr.decode().strip()}")
            detail = [GPUDetail.empty()]
    else:
        detail = [GPUDetail.empty()]
    
    return detail

# Function to get the hostname
def get_hostname():
    return socket.gethostname()

# Function to get network information
def get_net_info():
    net_info = {}
    for interface, addrs in psutil.net_if_addrs().items():
        for addr in addrs:
            if addr.family == socket.AF_INET:
                net_info[interface] = addr.address
    return net_info

# Function to get memory information
def get_mem_info():
    mem = psutil.virtual_memory()
    return {
        'used': mem.used,
        'total': mem.total
    }

# Function to get swap information
def get_swap_info():
    swap = psutil.swap_memory()
    return {
        'used': swap.used,
        'total': swap.total
    }

# Function to get CPU information
def get_cpu_info():
    return {
        'cpu_percent': psutil.cpu_percent(interval=1),
        #'cpu_temp': get_cpu_temperature()  # Placeholder, as getting CPU temp is platform-dependent
    }

# Function to get other system information
def get_others_info():
    return {
        'uptime': time.time() - psutil.boot_time(),
        'nowtime': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())
    }

# Main loop to gather and send information
def main():
    server_info = ServerInfo('123456', args.address)
    while True:
        hostname = get_hostname()
        net_info_result = get_net_info()
        mem_info_result = get_mem_info()
        swap_info_result = get_swap_info()
        cpu_info_result = get_cpu_info()
        other_info_result = get_others_info()
        
        gpu_info_result = get_gpu_info() if args.server == 'gpu' else []
        
        json_data = {
            "password": server_info.password,
            "gpu": gpu_info_result,
            "hostname": hostname,
            "net": net_info_result,
            "mem": mem_info_result,
            "swap": swap_info_result,
            "cpu": cpu_info_result,
            "other": other_info_result,
        }
        
        try:
            response = requests.post(server_info.addr, json=json_data)
            if response.status_code != 200:
                print(f"Send update data error: {response.status_code}")
        except requests.RequestException as e:
            print(e)
        
        time.sleep(args.interval)

if __name__ == '__main__':
    main()