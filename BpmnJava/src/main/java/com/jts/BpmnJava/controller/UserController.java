package com.jts.BpmnJava.controller;

import com.jts.BpmnJava.service.RoleService;
import com.jts.BpmnJava.service.UserService;
import com.jts.BpmnJava.user.Role;
import com.jts.BpmnJava.user.RoleName;
import com.jts.BpmnJava.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private RoleService roleService;

    @GetMapping
    public String listUsers(Model model) {
        List<User> users = userService.getAllUsers();
        List<Role> roles = roleService.getAllRoles();

        model.addAttribute("users", users);
        model.addAttribute("roles", roles);
        return "admin/users/list";
    }

    @GetMapping("/create")
    public String showCreateUserForm(Model model) {
        model.addAttribute("user", new User());
        model.addAttribute("roles", roleService.getAllRoles());
        return "admin/users/create";
    }

    @PostMapping("/create")
    public String createUser(@RequestParam String username,
                             @RequestParam String email,
                             @RequestParam String password,
                             @RequestParam String firstName,
                             @RequestParam String lastName,
                             @RequestParam(required = false) List<String> roleNames,
                             Model model) {
        try {
            Set<RoleName> roles = roleNames != null ?
                    roleNames.stream().map(RoleName::valueOf).collect(Collectors.toSet()) :
                    Set.of(RoleName.ROLE_VIEWER);

            User user = userService.createUser(username, email, password, roles);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            userService.updateUser(user.getId(), firstName, lastName, email);

            return "redirect:/admin/users?success=created";
        } catch (Exception e) {
            model.addAttribute("error", e.getMessage());
            model.addAttribute("roles", roleService.getAllRoles());
            return "admin/users/create";
        }
    }

    @GetMapping("/edit/{id}")
    public String showEditUserForm(@PathVariable Long id, Model model) {
        try {
            User user = userService.getUserById(id);
            model.addAttribute("user", user);
            model.addAttribute("roles", roleService.getAllRoles());
            return "admin/users/edit";
        } catch (Exception e) {
            model.addAttribute("error", e.getMessage());
            return "redirect:/admin/users?error=notfound";
        }
    }

    @PostMapping("/edit/{id}")
    public String updateUser(@PathVariable Long id,
                             @RequestParam String firstName,
                             @RequestParam String lastName,
                             @RequestParam String email,
                             @RequestParam(required = false) List<String> roleNames,
                             Model model) {
        try {
            Set<RoleName> roles = roleNames != null ?
                    roleNames.stream().map(RoleName::valueOf).collect(Collectors.toSet()) :
                    Set.of(RoleName.ROLE_VIEWER);

            userService.updateUser(id, firstName, lastName, email);
            userService.updateUserRoles(id, roles);

            return "redirect:/admin/users?success=updated";
        } catch (Exception e) {
            model.addAttribute("error", e.getMessage());
            User user = userService.getUserById(id);
            model.addAttribute("user", user);
            model.addAttribute("roles", roleService.getAllRoles());
            return "admin/users/edit";
        }
    }

    @PostMapping("/delete/{id}")
    public String deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return "redirect:/admin/users?success=deleted";
        } catch (Exception e) {
            return "redirect:/admin/users?error=deletefailed";
        }
    }
}