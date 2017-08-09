#!/usr/bin/python2

import os
import sys
import argparse
import subprocess


def xprint(message, error=False):
    if error:
        sys.stderr.write('mbed-cli: ' + message + '\n')
        sys.stderr.flush()
    else:
        sys.stdout.write('mbed-cli: ' + message + '\n')
        sys.stdout.flush()

def exit_on_fail(check_code, exit_code, message):

    if check_code != 0:

        import sys

        xprint(message, True)
        sys.exit(exit_code)

def mbed(cmd, args, chdir=None):

    try:
        if chdir is not None:
            os.chdir(chdir)

        r = subprocess.call(['mbed', cmd] + args)
    except Exception as e:
        print(e)
        r = 1
    finally:
        exit_on_fail(r, 1, 'mbed %s failed' % cmd)

def mbed_new(prj_dir, mbed_os=None, scm=None):

    xprint('creating new project: %s' % prj_dir)

    exit_on_fail(os.path.isdir(prj_dir) or os.path.isfile(prj_dir), 1, '  %s already exists!' % prj_dir)

    args = [prj_dir]

    if mbed_os is not None:
        if mbed_os == 'none':
            args.append('--create-only')
        elif mbed_os == 'classic':
            args.append('--mbedlib')

    if scm is not None:
        args.append('--scm')
        args.append(scm)

    mbed('new', args)

def mbed_target(prj_dir, target):

    xprint('setting target to: %s' % target)
    args = [target]
    mbed('target', args, prj_dir)

def mbed_toolchain(prj_dir, toolchain):

    xprint('setting toolchain to: %s' % toolchain)
    args = [toolchain]
    mbed('toolchain', args, prj_dir)

def mbed_add(prj_dir, library):

    xprint('adding library: %s' % library)
    args = [library]
    mbed('add', args, prj_dir)

def mbed_deploy(prj_dir):

    xprint('deploying ...')
    mbed('deploy', [], prj_dir)

def main_sample(prj_dir, filename='main.cpp'):

    xprint('wrting sample main: %s' % filename)
    src = """
#include "mbed.h"

DigitalOut led1(LED1);

// main() runs in its own thread in the OS
int main() {
    while (true) {
        led1 = !led1;
        wait(0.5);
    }
}
"""

    with open(os.path.join(prj_dir, filename), 'w') as f:
        f.write(src)


if __name__ == '__main__':

    parser = argparse.ArgumentParser(description='Mbed batch execution')

    parser.add_argument("--prj_dir", default=None, help="New project directory")
    parser.add_argument("--target", default=None, help="Target MCU")
    parser.add_argument("--toolchain", default=None, help="Toolchain to use")
    parser.add_argument("--os", default=None, help="mbed-os to use")
    parser.add_argument("--scm", default=None, help="SCM to use")
    parser.add_argument("--library", default=[], action='append', help="Library to add")
    parser.add_argument("--main", default=True, action="store_true", help="Add sample 'main.cpp'")

    args = parser.parse_args()

    exit_on_fail(args.prj_dir is None, 1, 'no project directory given')

    mbed_new(args.prj_dir, args.os, args.scm)

    if args.target is not None:
        mbed_target(args.prj_dir, args.target)

    if args.toolchain is not None:
        mbed_toolchain(args.prj_dir, args.toolchain)

    if args.main:
        main_sample(args.prj_dir)

    for lib in args.library:
        mbed_add(args.prj_dir, lib)

    if args.os == 'classic':
        mbed_deploy(args.prj_dir)
